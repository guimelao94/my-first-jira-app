import { useDispatch } from "react-redux";
import { fetchAvailableEpics, fetchSelectedEpics, ProcessEpic } from "../store";
import { reOrderEpics, setDevelopers, setEpicDevelopers, setEpicDevStack, setIssueData } from '../store/slices/epicSlice';
import { groupByDevs } from "../Utils/GroupingTools";
import { invoke, requestJira } from "@forge/bridge";

export const HandleEpicThunks = async (dispatch, type = 'FullRefresh',epics) => {
  var issueList = [];
  let selected = null;
  console.log(type);
  switch (type) {
    case 'FullRefresh':
      await dispatch(fetchAvailableEpics());
      selected= await dispatch(fetchSelectedEpics());
      //console.log(selected.payload);
      await HandleEpics(dispatch, selected, issueList);
      await HandleDevs(dispatch, issueList);
      await dispatch(reOrderEpics());
      const resp1 = await dispatch(setEpicDevStack());
      console.log(resp1.payload);
      break;
    case 'EpicRefresh':
      await dispatch(fetchAvailableEpics());
      selected = await dispatch(fetchSelectedEpics());
      //console.log(selected.payload);
      await HandleEpics(dispatch, selected, issueList);
      await dispatch(reOrderEpics());
      const resp2 = await dispatch(setEpicDevStack());
      console.log(resp2.payload);
      
      break;
    default:
      break;
  }

}

export const HandleDevs = async (dispatch, issueList) => {
  var devs = groupByDevs(issueList, 'dev');
  console.log(devs);
  var data = await RefreshDevelopersList(devs);
  console.log(data);
  await dispatch(setDevelopers(data));
}

export const HandleEpics = async (dispatch, selected, issueList) => {
  for (let index = 0; index < selected.payload.length; index++) {
    const element = selected.payload[index];
    var epic = await dispatch(ProcessEpic(element));
    //console.log(epic);
    if (epic.payload) {
      for (let idx = 0; idx < epic.payload.Issues.length; idx++) {
        const issue = epic.payload.Issues[idx];
        //console.log(issue);
        //console.log(idx);
        const issueData = await FillIssueData({ item: issue, index: idx })
        issueList.push(issueData);
      }
      await dispatch(setIssueData(issueList.filter(x => x.EpicKey == epic.payload.EpicKey)));
      const devs = groupByDevs(issueList.filter(x => x.EpicKey == epic.payload.EpicKey), 'dev');
      //console.log(devs);
      await dispatch(setEpicDevelopers({ EpicKey: epic.payload.EpicKey, Developers: devs }));
    }
  }
}

const FillIssueData = async ({ item, index }) => {
  var customFields = {
    Overflow: []
  }

  var workLogs = [];

  //console.log(item);
  //console.log(index);
  const jql = await requestJira(`/rest/api/3/issue/${item.key}/worklog`);
  const returnedData = await jql.json();
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

  const storageData = await invoke('Storage.GetData', { key: item.key });

  if (Object.keys(storageData).length === 0) {
    console.log('empty');
    invoke('Storage.SaveData', { key: item.key, value: customFields }).then((storageData) => {
      //console.log(storageData);
    });
  } else {
    customFields = storageData;
  }

  var issueData = {
    idx: index,
    EpicKey: item.fields.parent.key,
    dev: customFields.Developer != null ? {FullName:customFields.Developer.FullName,AccountID:customFields.Developer.AccountID} : "",
    ticketNumber: item.key,
    remainingTime: item.fields?.timeestimate ? (item.fields?.timeestimate + (customFields.Overflow ? (customFields.Overflow.reduce((total, item) => total + (item['TimeSpent'] || 0), 0)) : 0)) : 0,
    timespent: item.fields?.timespent,
    originalestimate: item.fields?.timeoriginalestimate,
    overflowTime: customFields.Overflow,
    worklogs: workLogs
  }
  //console.log(issueData);
  return issueData;

}

export const RefreshDevelopersList = async (devs) => {
  var devsList = devs.map((dev) => ({
    FullName: dev.FullName,
    ShortName: dev.ShortName,
    AccountID:dev.AccountID,
    AvailableHours: 0,
    Meetings: 0,
    DevHours: 0
  }));

  const returnedData = await invoke('Storage.GetData', { key: 'DevelopersList' });
  if (Object.keys(returnedData).length === 0) {
    console.log('empty');
    return devsList;
  } else {
    //console.log(devsList);
    //console.log(returnedData);
    if (devsList.length != returnedData.length) {
      const unionArray = [...new Set([...devsList.filter(x => !returnedData.some(dev => dev.FullName === x.FullName)), ...returnedData.filter(x => devsList.some(dev => dev.FullName === x.FullName))])];
      devsList = unionArray;
      //console.log(unionArray);
    }
    else {
      devsList = returnedData;
    }
    for (let index = 0; index < devsList.length; index++) {
      var dev = devsList[index];
      var resp = await requestJira(`/rest/api/3/user?accountId=${dev.AccountID}`);
      var Developer = await resp.json();
      dev.AvatarUrl = Developer.avatarUrls['16x16']
    }
    
    return devsList;
  }
}