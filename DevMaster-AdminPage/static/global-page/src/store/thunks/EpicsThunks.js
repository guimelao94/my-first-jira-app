import { invoke, requestJira } from "@forge/bridge";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const fetchAvailableEpics = createAsyncThunk('epics/fetchAvailable',async ()=>{
    const res = await requestJira(`/rest/api/3/search?jql=issueType=Epic`);

    const data = await res.json();

    var epicList = data.issues.map((item) => ({
        label: item.key,
        value: item.key
    }));

    console.log(data);
    console.log(epicList);

    return epicList;
});

export const fetchSelectedEpics = createAsyncThunk('epics/fetchSelected',async ()=>{
    var res = [];
    await invoke('Storage.GetData', { key: 'Cards' }).then((returnedData) => {
        console.log(returnedData);
        //var newArray = [...returnedData, ...state.Selected]
        res = returnedData;
    });
    return res;
});

export const ProcessEpic = createAsyncThunk('epics/Process',async (epicKey)=>{
    var issuesList = [];

    console.log(epicKey);
    const res = await requestJira(`/rest/api/3/issue/${epicKey}`);

    const data = await res.json();

    console.log(data);

    if (data.fields.issuetype.name == "Epic") {
        const jql = await requestJira(`/rest/api/3/search?jql=parent=${epicKey}`);
        const returnedData = await jql.json();
        const EpicObj = {
            EpicKey: epicKey,
            DueDate: data.fields.duedate,
            IssueType: data.fields.issuetype.name,
            Issues:returnedData.issues
        };
        console.log(EpicObj)
        return EpicObj;
    }else{
        return null;
    }

});

export const GenerateIssueData = createAsyncThunk('epics/GenerateIssueData',async ({item,index})=>{
    var customFields = {
      OverflowTime: 0
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
        dev: item.fields.assignee?.displayName,
        ticketNumber: item.key,
        remainingTime: item.fields?.timeestimate,
        timespent: item.fields?.timespent,
        originalestimate: item.fields?.timeoriginalestimate,
        overflowTime: customFields.OverflowTime,
        worklogs: workLogs
      }
      console.log(issueData);
      return issueData;
  
});

const pause = (duration) =>{
    return new Promise((resolve)=>{
        setTimeout(resolve,duration);
    })
};