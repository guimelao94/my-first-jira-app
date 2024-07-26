import React, { useEffect, useState } from 'react';
import { view,requestJira,invoke  } from '@forge/bridge';
import api, { route } from "@forge/api";


function App() {
  const [issue, setIssue] = useState(0);

  const GenerateIssueData = (item,index) =>{
    var customFields = {
        OverflowTime : 0
    }
    invoke('Storage.GetData', { key:item.key}).then((returnedData) =>{
        if(Object.keys(returnedData).length === 0){
            console.log('empty');
            invoke('Storage.SaveData', { key:item.key,value:customFields}).then((returnedData) =>{
                console.log(returnedData);
            });
        }else{
            if(returnedData.OverflowTime > 0){
              returnedData.OverflowTime = returnedData.OverflowTime / 3600;
            }
            customFields = returnedData;
        }   
    });
    var issueData = {
        idx:index,
        dev:item.fields.assignee?.displayName,
        ticketNumber:item.key,
        remainingTime:item.fields?.timeestimate,
        timespent:item.fields?.timespent,
        originalestimate:item.fields?.timeoriginalestimate,
        overflowTime:customFields.OverflowTime
    }

    return issueData;
  };

  const GetHours = async () => {
    const req = await view.getContext();
    const key = req.extension.issue.key;
    const res = await requestJira(`/rest/api/3/issue/${key}`);
    const data = await res.json();
    setIssue(GenerateIssueData(data,0));

    return "";
  }

  const SaveHours = async (overflowTime) => {
    invoke('Storage.SaveData', { key:issue.ticketNumber,value:{OverflowTime:(overflowTime*3600)}}).then((returnedData) =>{
      console.log(returnedData);
  });
  }
const handleChange = (e) => {
  const { name, value } = e.target;
  setIssue((prev)=>({...prev,overflowTime:value}))
  SaveHours(value)
};
  useEffect(() => {
    GetHours()
  }, []);

  return (
    <div>
      <input type="text" name="overflowHours" value={issue.overflowTime} onChange={handleChange} />
    </div>
  );
}

export default App;



