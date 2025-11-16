import { useDispatch } from "react-redux";
import { fetchAvailableEpics, fetchHolidays, fetchSelectedEpics, ProcessEpic } from "../store";
import { reOrderEpics, setDevelopers, setEpicDevelopers, setEpicDevStack, setHolidays, setIssueData } from '../store/slices/epicSlice';
import { groupByDevs } from "../Utils/GroupingTools";
import { invoke, requestJira } from "@forge/bridge";

export const HandleEpicThunks = async (dispatch, type = 'FullRefresh', epics, currentUserAccountId) => {
  let issueList = [];
  let selected = null;
  
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
        }
        await dispatch(reOrderEpics());
        await dispatch(setEpicDevStack());
      } else {
        console.log('FullRefresh: No selected epics found, initializing empty state');
        // Even if no epics selected, ensure data is initialized as empty array
        dispatch(setIssueData([]));
      }
      break;
    case 'EpicRefresh':
      await dispatch(fetchAvailableEpics());
      selected = await dispatch(fetchSelectedEpics());
      if (selected?.payload && Array.isArray(selected.payload) && selected.payload.length > 0) {
        await HandleEpics(dispatch, selected, issueList);
        await dispatch(reOrderEpics());
        await dispatch(setEpicDevStack());
      }
      break;
    default:
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
      const epic = await dispatch(ProcessEpic(element));
      
      if (epic.payload && epic.payload.Issues) {
        console.log(`HandleEpics: Epic ${element} has ${epic.payload.Issues.length} issues`);
        // Process issues in parallel for better performance
        const issuePromises = epic.payload.Issues.map((issue, idx) => 
          FillIssueData({ item: issue, index: idx })
        );
        const epicIssues = await Promise.all(issuePromises);
        
        issueList.push(...epicIssues);
        
        const epicIssuesFiltered = issueList.filter(x => x.EpicKey === epic.payload.EpicKey);
        await dispatch(setIssueData(epicIssuesFiltered));
        
        const devs = groupByDevs(epicIssuesFiltered, 'dev');
        await dispatch(setEpicDevelopers({ EpicKey: epic.payload.EpicKey, Developers: devs }));
      } else {
        console.log(`HandleEpics: Epic ${element} has no issues or payload is null`);
      }
    } catch (error) {
      console.error(`HandleEpics: Error processing epic ${element}:`, error);
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
    requestJira(`/rest/api/3/issue/${item.key}/worklog`).then(res => res.json()),
    invoke('Storage.GetData', { key: item.key })
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

  // Store full worklog data for date filtering (created date and accountID)
  const fullWorklogs = (worklogResponse.worklogs || []).map(worklog => ({
    accountId: worklog.author?.accountId,
    timeSpentSeconds: worklog.timeSpentSeconds || 0,
    created: worklog.created,
    started: worklog.started
  }));

  // Initialize storage if empty
  if (!storageData || Object.keys(storageData).length === 0) {
    await invoke('Storage.SaveData', { key: item.key, value: customFields });
  } else {
    customFields = storageData;
  }

  const overflowTimeFromStorage = customFields.Overflow?.reduce((total, item) => 
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
    overflowTime: customFields.Overflow || [],
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
        const resp = await requestJira(`/rest/api/3/user?accountId=${dev.AccountID}`);
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