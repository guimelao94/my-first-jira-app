import { useDispatch } from "react-redux";
import { fetchAvailableEpics, fetchSelectedEpics, ProcessEpic } from "../store";
import { setEpicDevelopers, setIssueData } from '../store/slices/epicSlice';
import { groupByDevs } from "../Utils/GroupingTools";
import { invoke, requestJira } from "@forge/bridge";

export 	const HandleEpicThunks = async (dispatch) => {
    await dispatch(fetchAvailableEpics());
    const selected = await dispatch(fetchSelectedEpics());
    console.log(selected.payload);
    for (let index = 0; index < selected.payload.length; index++) {
        const element = selected.payload[index];
        var epic = await dispatch(ProcessEpic(element));
        console.log(epic);
        if (epic.payload) {
            console.log(epic.payload.Issues);
            var issueList = [];
            for (let idx = 0; idx < epic.payload.Issues.length; idx++) {
                const issue = epic.payload.Issues[idx];
                //console.log(issue);
                //console.log(idx);
                const issueData = await FillIssueData({item:issue, index:idx})
                issueList.push(issueData);
                console.log(issueData);
            }
            await dispatch(setIssueData(issueList));
            const devs = groupByDevs(issueList, 'dev');
            console.log(devs);
            await dispatch(setEpicDevelopers({EpicKey:epic.payload.EpicKey, Developers:devs}));
        }
    }
}

const FillIssueData = async ({item,index})=> {
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
        EpicKey:item.fields.parent.key,
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
  
  }