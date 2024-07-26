import { convertToHours } from '../../Utils/ConversionTools';
import { groupByDevs } from '../../Utils/GroupingTools';
import { invoke, requestJira } from '@forge/bridge';

export const HandleEpics = async (epicKey, setCardData, setStorage, storage) => {
  var devs = [];
  var issuesList = [];

  console.log(epicKey);
  const res = await requestJira(`/rest/api/3/issue/${epicKey}`);

  const data = await res.json();

  console.log(data);

  if (data.fields.issuetype.name == "Epic") {
    const jql = await requestJira(`/rest/api/3/search?jql=parent=${epicKey}`);
    await jql.json().then((returnedData) => {
      console.log(returnedData);
      returnedData.issues.map((item, index) => (GenerateIssueData(item, index, returnedData.issues.length, issuesList, setStorage, storage)));
      setCardData((prev) => ({
        ...prev,
        EpicKey: epicKey,
        DueDate: data.fields.duedate,
        IssueType: data.fields.issuetype.name
      }));
    });
  }
  return "";
}

export const RefreshData = (issuesList, setDevelopers, setIssues, setLoaded, setCardData, developersList, setDevelopersList,devStackData,setDevStackData) => {
  if (issuesList.length > 0) {
    var devs = [];
    devs = groupByDevs(issuesList, 'dev');
    var devsList = RefreshDevelopersList(devs,setDevelopersList);

    console.log(issuesList);
    console.log(devs);
    setDevelopers(devs);
    setIssues(issuesList);
    setCardData((prev) => ({
      ...prev,
      TimeRemaining: convertToHours(devs.reduce((total, item) => total + (item['RemainingWork'] || 0), 0)),
      TimeSpent: convertToHours(devs.reduce((total, item) => total + (item['TimeSpent'] || 0), 0)),
      OriginalEstimate: convertToHours(devs.reduce((total, item) => total + (item['OriginalEstimate'] || 0), 0)),
      OverflowTime: convertToHours(devs.reduce((total, item) => total + (item['OverflowTime'] || 0), 0))
    }));
    console.log(issuesList)
    setLoaded(true);
  }
}

export const RefreshDevelopersList = (devs,setDevelopersList) => {
  var devsList = devs.map((dev) =>({
    FullName:dev.FullName,
    ShortName:dev.ShortName,
    AvailableHours: 0, 
    Meetings:0, 
    DevHours:0
  }));

  invoke('Storage.GetData', { key: 'DevelopersList' }).then((returnedData) => {
    if (Object.keys(returnedData).length === 0) {
      console.log('empty');
      setDevelopersList(devsList)
    } else {
      if(devsList.length != returnedData.length){
        const unionArray = [...new Set([...devsList, ...returnedData])];
        devsList = unionArray;
      }
      else{
        devsList = returnedData;
      }

      setDevelopersList(devsList)
      return devsList;
    }
  });
}

export const GetStorage = async (item, setLoadedStorage) => {
  const data = await invoke('Storage.GetData2', { key: item.key });
  setLoadedStorage(true);
  return data;
}

export const GenerateIssueData = async (item, index, total, issuesList, setStorage, storage) => {
  var customFields = {
    OverflowTime: 0
  }

  var workLogs = [];

  const jql = await requestJira(`/rest/api/3/issue/${item.key}/worklog`);
  await jql.json().then((returnedData) => {
    workLogs = Object.entries(
      returnedData.worklogs.map((item, index) => ({
        TimeSpent: item.timeSpentSeconds,
        Developer: item.author.displayName
      })).reduce((acc, { Developer, TimeSpent }) => {
        if (!acc[Developer]) {
          acc[Developer] = 0;
        }
        acc[Developer] += TimeSpent;
        return acc;
      }, {})
    ).map(([Developer, TimeSpent]) => ({ Developer, TimeSpent }));
  });

  var newArray = issuesList;
  invoke('Storage.GetData', { key: item.key }).then((returnedData) => {
    if (Object.keys(returnedData).length === 0) {
      console.log('empty');
      invoke('Storage.SaveData', { key: item.key, value: customFields }).then((returnedData) => {
        console.log(returnedData);
      });
    } else {
      customFields = returnedData;
    }

    var issueData = {
      idx: index,
      dev: item.fields.assignee?.displayName,
      ticketNumber: item.key,
      remainingTime: item.fields?.timeestimate,
      timespent: item.fields?.timespent,
      originalestimate: item.fields?.timeoriginalestimate,
      overflowTime: customFields.OverflowTime,
      worklogs: workLogs
    }

    newArray.push(issueData);
    if (newArray.length == total) {
      setStorage([...newArray]);
    }

    return issueData;
  });

};

