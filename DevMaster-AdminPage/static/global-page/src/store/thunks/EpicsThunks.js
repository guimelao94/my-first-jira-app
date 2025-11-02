import { invoke, requestJira } from "@forge/bridge";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const fetchAvailableEpics = createAsyncThunk('epics/fetchAvailable',async ()=>{
    const res = await requestJira(`/rest/api/3/search/jql?jql=issueType=Epic%20ORDER%20BY%20updated%20DESC&maxResults=1000&fields=*all`);

    const data = await res.json();

    return data.issues.map((item) => ({
        label: item.key,
        value: item.key
    }));
});

export const fetchSelectedEpics = createAsyncThunk('epics/fetchSelected',async ()=>{
    try {
        const res = await invoke('Storage.GetData', { key: 'Cards' });
        return res || [];
    } catch (error) {
        console.error('Error fetching selected epics:', error);
        return [];
    }
});

export const fetchHolidays = createAsyncThunk('epics/fetchHolidays',async ()=>{
    try {
        const res = await invoke('Storage.GetData', { key: 'Holidays' });
        return res || [];
    } catch (error) {
        console.error('Error fetching holidays:', error);
        return [];
    }
});

export const SaveSelectedEpics = createAsyncThunk('epics/SaveSelected',async (newArray)=>{    
    try {
        await invoke('Storage.SaveData', { key: 'Cards', value: newArray });
    } catch (error) {
        console.error('Error saving selected epics:', error);
        throw error;
    }
    return newArray;
});

export const ProcessEpic = createAsyncThunk('epics/Process',async (epicKey)=>{
    try {
        const res = await requestJira(`/rest/api/3/issue/${epicKey}`);
        const data = await res.json();

        if (data.fields?.issuetype?.name === "Epic") {
            const jql = await requestJira(`/rest/api/3/search/jql?jql=parent=${epicKey}&maxResults=1000&fields=*all`);
            const returnedData = await jql.json();

            return {
                EpicKey: epicKey,
                DueDate: data.fields.duedate,
                IssueType: data.fields.issuetype.name,
                Issues: returnedData.issues || [],
                Summary: data.fields.summary
            };
        }
        return null;
    } catch (error) {
        console.error(`Error processing epic ${epicKey}:`, error);
        throw error;
    }
});


const pause = (duration) =>{
    return new Promise((resolve)=>{
        setTimeout(resolve,duration);
    })
};