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


const pause = (duration) =>{
    return new Promise((resolve)=>{
        setTimeout(resolve,duration);
    })
};