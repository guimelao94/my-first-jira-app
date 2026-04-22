import { useDispatch } from "react-redux";
import { fetchAvailableEpics, fetchHolidays, fetchSelectedEpics, ProcessEpic } from "../store";
import { completeRefresh, markEpicLoadFailed, reOrderEpics, setDevelopers, setEpicDevelopers, setEpicDevStack, setHolidays, setIssueData, startRefresh } from '../store/slices/epicSlice';
import { groupByDevs } from "../Utils/GroupingTools";
import { invoke, requestJira } from "@forge/bridge";
import { createTransientError, delay, retryBridgeOperation } from "../Utils/BridgeRetry";

const ISSUE_PROCESS_CONCURRENCY = 2;

// Limit how many heavy requests run at once to avoid hitting Forge/Jira rate limits
const processWithConcurrency = async (items, handler, concurrency = 3) => {
  const results = new Array(items.length);
  let index = 0;

  const worker = async () => {
    while (index < items.length) {
      const currentIndex = index++;
      try {
        results[currentIndex] = await handler(items[currentIndex], currentIndex);
      } catch (error) {
        console.error('processWithConcurrency: handler failed', { currentIndex, error });
        results[currentIndex] = null;
      }
    }
  };

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, worker);
  await Promise.all(workers);
  return results;
};

const requestJiraWithRetry = async (url, options = undefined, description = 'requestJira call') => {
  return retryBridgeOperation(async () => {
    const response = await requestJira(url, options);

    if (response.status === 429) {
      const retryAfter = Number(response.headers?.get('retry-after')) || 0;
      if (retryAfter > 0) {
        await delay(retryAfter * 1000);
      }
      throw createTransientError(`Rate limited during ${description}`, { status: response.status });
    }

    if (response.status >= 500) {
      throw createTransientError(`Temporary Jira error during ${description}`, { status: response.status });
    }

    return response;
  }, { description });
};

const fetchWorklogsWithRetry = async (issueKey) => {
  return retryBridgeOperation(async () => {
    const response = await requestJiraWithRetry(
      `/rest/api/3/issue/${encodeURIComponent(issueKey)}/worklog`,
      undefined,
      `fetch worklogs for ${issueKey}`
    );
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Failed to fetch worklogs for ${issueKey}: ${response.status} ${body}`);
    }
    return response.json();
  }, { description: `Fetch worklogs for ${issueKey}` });
};

const fetchStorageWithRetry = async (key) => {
  return retryBridgeOperation(
    () => invoke('Storage.GetData', { key }),
    { description: `Fetch storage for ${key}` }
  );
};

const saveStorageWithRetry = async (key, value) => {
  return retryBridgeOperation(
    () => invoke('Storage.SaveData', { key, value }),
    { description: `Save storage for ${key}` }
  );
};

const normalizeOverflowEntries = (entries) => {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries.filter(Boolean).map((entry) => ({
    ...entry,
    Category: entry?.Category || 'Uncategorized'
  }));
};

export const HandleEpicThunks = async (dispatch, type = 'FullRefresh', epics, currentUserAccountId) => {
  let issueList = [];
  let selected = null;
  dispatch(startRefresh());
  
  switch (type) {
    case 'FullRefresh':
      // Fetch in parallel where possible
      await Promise.all([
        dispatch(fetchAvailableEpics()),
        dispatch(fetchHolidays()).then(result => {
          if (result.payload) {
            dispatch(setHolidays(result.payload));
          }
        })
      ]);
      
      selected = await dispatch(fetchSelectedEpics());
      console.log('FullRefresh: Selected epics:', selected?.payload);
      // Process epics if we have any selected
      if (selected?.payload && Array.isArray(selected.payload) && selected.payload.length > 0) {
        console.log(`FullRefresh: Found ${selected.payload.length} selected epics, processing...`);
        await HandleEpics(dispatch, selected, issueList);
        if (issueList.length > 0) {
          await HandleDevs(dispatch, issueList, currentUserAccountId);
        } else {
          dispatch(setDevelopers([]));
        }
        await dispatch(reOrderEpics());
        await dispatch(setEpicDevStack());
      } else {
        console.log('FullRefresh: No selected epics found, initializing empty state');
        dispatch(setDevelopers([]));
      }
      dispatch(completeRefresh());
      break;
    case 'EpicRefresh':
      await dispatch(fetchAvailableEpics());
      selected = await dispatch(fetchSelectedEpics());
      if (selected?.payload && Array.isArray(selected.payload) && selected.payload.length > 0) {
        await HandleEpics(dispatch, selected, issueList);
        if (issueList.length > 0) {
          await HandleDevs(dispatch, issueList, currentUserAccountId);
        } else {
          dispatch(setDevelopers([]));
        }
        await dispatch(reOrderEpics());
        await dispatch(setEpicDevStack());
      } else {
        dispatch(setDevelopers([]));
      }
      dispatch(completeRefresh());
      break;
    default:
      dispatch(completeRefresh());
      break;
  }
}

export const HandleDevs = async (dispatch, issueList, currentUserAccountId) => {
  console.log(`HandleDevs: Processing ${issueList.length} issues`);
  const devs = groupByDevs(issueList, 'dev');
  console.log('HandleDevs: Grouped developers:', devs?.length || 0);
  const data = await RefreshDevelopersList(devs, currentUserAccountId);
  console.log('HandleDevs: Refreshed developers list:', data?.length || 0);
  await dispatch(setDevelopers(data));
  console.log('HandleDevs: Completed');
}

export const HandleEpics = async (dispatch, selected, issueList) => {
  if (!selected?.payload || !Array.isArray(selected.payload) || selected.payload.length === 0) {
    console.log('HandleEpics: No selected epics to process');
    return;
  }
  
  console.log(`HandleEpics: Processing ${selected.payload.length} epics`);
  
  for (let index = 0; index < selected.payload.length; index++) {
    const element = selected.payload[index];
    try {
      console.log(`HandleEpics: Processing epic ${element}`);
      const epic = await dispatch(ProcessEpic(element)).unwrap();
      
      if (epic && epic.Issues) {
        console.log(`HandleEpics: Epic ${element} has ${epic.Issues.length} issues`);
        // Process issues with a small concurrency limit to avoid rate limits
        const epicIssues = await processWithConcurrency(
          epic.Issues,
          (issue, idx) => FillIssueData({ item: issue, index: idx }),
          ISSUE_PROCESS_CONCURRENCY
        );
        const validEpicIssues = epicIssues.filter(Boolean);

        if (validEpicIssues.length !== epic.Issues.length) {
          console.warn(
            `HandleEpics: Loaded ${validEpicIssues.length} of ${epic.Issues.length} issues for epic ${element}`
          );
        }
        
        issueList.push(...validEpicIssues);
        
        const epicIssuesFiltered = issueList.filter(x => x.EpicKey === epic.EpicKey);
        await dispatch(setIssueData(epicIssuesFiltered));
        
        const devs = groupByDevs(epicIssuesFiltered, 'dev');
        await dispatch(setEpicDevelopers({
          EpicKey: epic.EpicKey,
          Developers: devs,
          issueCount: validEpicIssues.length
        }));
      } else {
        console.log(`HandleEpics: Epic ${element} has no issues or payload is null`);
      }
    } catch (error) {
      console.error(`HandleEpics: Error processing epic ${element}:`, error);
      dispatch(markEpicLoadFailed({
        EpicKey: element,
        error: error?.message || 'Failed to load epic'
      }));
    }
  }
  
  console.log(`HandleEpics: Completed processing, total issues: ${issueList.length}`);
}

const FillIssueData = async ({ item, index }) => {
  let customFields = {
    Overflow: [],
    isCompleted: null
  };

  // Fetch worklogs and storage in parallel for better performance
  const [worklogResponse, storageData] = await Promise.all([
    fetchWorklogsWithRetry(item.key),
    fetchStorageWithRetry(item.key)
  ]);

  // Process worklogs - store full worklog data for date filtering
  const workLogsMap = (worklogResponse.worklogs || []).reduce((acc, worklog) => {
    const developer = worklog.author?.displayName;
    if (developer) {
      acc[developer] = (acc[developer] || 0) + (worklog.timeSpentSeconds || 0);
    }
    return acc;
  }, {});
  
  const workLogs = Object.entries(workLogsMap).map(([Developer, TimeSpent]) => ({ 
    Developer, 
    TimeSpent 
  }));

  // Helper function to extract plain text from worklog comment (handles ADF format)
  const extractCommentText = (comment) => {
    if (!comment) return '';
    if (typeof comment === 'string') return comment;
    if (comment.content && Array.isArray(comment.content)) {
      // ADF format - extract text from content array
      const extractText = (content) => {
        if (typeof content === 'string') return content;
        if (content.text) return content.text;
        if (content.content && Array.isArray(content.content)) {
          return content.content.map(extractText).join('');
        }
        return '';
      };
      return comment.content.map(extractText).join('');
    }
    return '';
  };

  // Store full worklog data for date filtering (created date and accountID)
  const fullWorklogs = (worklogResponse.worklogs || []).map(worklog => ({
    accountId: worklog.author?.accountId,
    timeSpentSeconds: worklog.timeSpentSeconds || 0,
    created: worklog.created,
    started: worklog.started,
    comment: extractCommentText(worklog.comment) // Store worklog description/comment for time range parsing
  }));

  // Initialize storage if empty
  if (!storageData || Object.keys(storageData).length === 0) {
    await saveStorageWithRetry(item.key, customFields);
  } else {
    customFields = storageData;
  }

  const overflowEntries = normalizeOverflowEntries(customFields.Overflow);

  const overflowTimeFromStorage = overflowEntries.reduce((total, item) => 
    total + (item.TimeSpent || 0), 0) || 0;
  
  const remainingTime = item.fields?.timeoriginalestimate 
    ? ((item.fields.timeoriginalestimate - (item.fields.timespent || 0)) + overflowTimeFromStorage)
    : 0;
  
  const overflowCalculated = Math.max(0, (item.fields?.timespent || 0) - (item.fields?.timeoriginalestimate || 0));

  return {
    idx: index,
    EpicKey: item.fields.parent?.key,
    dev: customFields.Developer ? {
      FullName: customFields.Developer.FullName,
      AccountID: customFields.Developer.AccountID
    } : "",
    ticketNumber: item.key,
    assignee: {
      FullName: item.fields?.assignee?.displayName,
      AvatarUrl: item.fields?.assignee?.avatarUrls?.["16x16"]
    },
    isCompleted: customFields.isCompleted,
    status: item.fields?.status?.name,
    remainingTime,
    timespent: item.fields?.timespent || 0,
    originalestimate: item.fields?.timeoriginalestimate || 0,
    overflowTime: overflowEntries,
    worklogs: workLogs,
    fullWorklogs: fullWorklogs, // Store full worklog data for date filtering
    overflowCalculated
  };
}

export const RefreshDevelopersList = async (devs, currentUserAccountId) => {
  const devsList = devs.map((dev) => ({
    FullName: dev.FullName,
    ShortName: dev.ShortName,
    AccountID: dev.AccountID,
    AvailableHours: 0,
    Meetings: 0,
    DevHours: 0
  }));

  // Developers list can be shared or user-specific - using shared for now
  // Can be changed to user-specific if needed by adding useUserPrefix flag
  const returnedData = await invoke('Storage.GetData', { 
    key: 'DevelopersList',
    useUserPrefix: false // Keep developers list global/shared
  });
  
  if (!returnedData || Object.keys(returnedData).length === 0) {
    return devsList;
  }

  // Merge existing and new developers
  let mergedDevs;
  if (devsList.length !== returnedData.length) {
    const existingDevNames = new Set(returnedData.map(d => d.FullName));
    const newDevs = devsList.filter(x => !existingDevNames.has(x.FullName));
    mergedDevs = [...returnedData, ...newDevs];
  } else {
    mergedDevs = returnedData;
  }

  // Fetch missing avatars in parallel
  const devsNeedingAvatars = mergedDevs.filter(x => !x.AvatarUrl && x.AccountID);
  if (devsNeedingAvatars.length > 0) {
    const avatarPromises = devsNeedingAvatars.map(async (dev) => {
      try {
        const resp = await requestJiraWithRetry(
          `/rest/api/3/user?accountId=${encodeURIComponent(dev.AccountID)}`,
          undefined,
          `fetch avatar for ${dev.FullName}`
        );
        const developer = await resp.json();
        dev.AvatarUrl = developer.avatarUrls?.['16x16'];
      } catch (error) {
        console.error(`Error fetching avatar for ${dev.FullName}:`, error);
      }
    });
    
    await Promise.all(avatarPromises);
  }
  
  return mergedDevs;
}
