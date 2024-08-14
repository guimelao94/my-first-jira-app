import { useDispatch } from "react-redux";
import { fetchAvailableEpics, fetchSelectedEpics, ProcessEpic } from "../store";
import { setDevelopers, setEpicDevelopers, setIssueData } from '../store/slices/epicSlice';
import { groupByDevs } from "../Utils/GroupingTools";
import { invoke, requestJira } from "@forge/bridge";

export const HandleEpicThunks = async (dispatch, type = 'FullRefresh') => {
  var issueList = [];
  let selected = null;
  console.log(type);
  switch (type) {
    case 'FullRefresh':
      await dispatch(fetchAvailableEpics());
      selected= await dispatch(fetchSelectedEpics());
      console.log(selected.payload);
      await HandleEpics(dispatch, selected, issueList);
      await HandleDevs(dispatch, issueList);
      break;
    case 'EpicRefresh':
      await dispatch(fetchAvailableEpics());
      selected = await dispatch(fetchSelectedEpics());
      console.log(selected.payload);
      await HandleEpics(dispatch, selected, issueList);
      break;
    default:
      break;
  }

}

export const HandleDevs = (dispatch, issueList) => {
  var devs = groupByDevs(issueList, 'dev');
  console.log(devs);
  RefreshDevelopersList(devs).then((data) => {
    console.log(data);
    dispatch(setDevelopers(data));
  });
}

export const HandleEpics = async (dispatch, selected, issueList) => {
  for (let index = 0; index < selected.payload.length; index++) {
    const element = selected.payload[index];
    var epic = await dispatch(ProcessEpic(element));
    console.log(epic);
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
      console.log(devs);
      await dispatch(setEpicDevelopers({ EpicKey: epic.payload.EpicKey, Developers: devs }));
    }
  }
}

const FillIssueData = async ({ item, index }) => {
  var customFields = {
    Overflow: []
  }

  var workLogs = [];

  console.log(item);
  console.log(index);
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
      console.log(storageData);
    });
  } else {
    customFields = storageData;
  }
  
  var issueData = {
    idx: index,
    EpicKey: item.fields.parent.key,
    dev: customFields.Developer != null ? customFields.Developer.FullName : "",
    ticketNumber: item.key,
    remainingTime: item.fields?.timeestimate,
    timespent: item.fields?.timespent,
    originalestimate: item.fields?.timeoriginalestimate,
    overflowTime: customFields.Overflow,
    worklogs: workLogs
  }
  console.log(issueData);
  return issueData;

}

export const RefreshDevelopersList = async (devs) => {
  var devsList = devs.map((dev) => ({
    FullName: dev.FullName,
    ShortName: dev.ShortName,
    AvailableHours: 0,
    Meetings: 0,
    DevHours: 0
  }));

  const returnedData = await invoke('Storage.GetData', { key: 'DevelopersList' });
  if (Object.keys(returnedData).length === 0) {
    console.log('empty');
    return devsList;
  } else {
    console.log(devsList);
    console.log(returnedData);
    if (devsList.length != returnedData.length) {
      const unionArray = [...new Set([...devsList.filter(x => !returnedData.some(dev => dev.FullName === x.FullName)), ...returnedData.filter(x => devsList.some(dev => dev.FullName === x.FullName))])];
      devsList = unionArray;
      console.log(unionArray);
    }
    else {
      devsList = returnedData;
    }
    console.log(devsList);
    return devsList;
  }
}