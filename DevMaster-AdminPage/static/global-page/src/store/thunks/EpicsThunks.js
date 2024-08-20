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
    console.log('fetchSelected');
    try {
        const res = await invoke('Storage.GetData', { key: 'Cards' });
        console.log(res);
        return res;
    } catch (error) {
        console.log(error);
    }
    
    
});

export const fetchHolidays = createAsyncThunk('epics/fetchHolidays',async ()=>{
    console.log('fetchHolidays');
    try {
        const res = await invoke('Storage.GetData', { key: 'Holidays' });
        console.log(res);
        return res;
    } catch (error) {
        console.log(error);
    }
    
    
});

export const SaveSelectedEpics = createAsyncThunk('epics/SaveSelected',async (newArray)=>{    
    invoke('Storage.SaveData', { key: 'Cards', value: newArray }).then((returnedData) => {
        console.log(returnedData);
    });
    return newArray;
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