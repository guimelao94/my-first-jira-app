import { invoke, requestJira } from "@forge/bridge";

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