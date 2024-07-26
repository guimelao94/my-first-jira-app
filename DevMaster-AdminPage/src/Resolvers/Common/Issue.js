import { Storage } from "../Landing/Main";

export const Issue = {
    GenerateIssueData :(req) => {
        var customFields = {
            OverflowTime : 0
        }
        //return req.payload;
        var returnedData = Storage.GetData_Internal(req.payload.item.key);
        //return returnedData;
        if(Object.keys(returnedData).length === 0){
            //console.log('empty');
            Storage.SaveData(req.payload.item.key,customFields);
        }else{
            customFields = returnedData;
        } 
        var issueData = {
            idx:req.payload.index,
            dev:req.payload.item.fields.assignee?.displayName,
            ticketNumber:req.payload.item.key,
            remainingTime:req.payload.item.fields?.timeestimate,
            timespent:req.payload.item.fields?.timespent,
            originalestimate:req.payload.item.fields?.timeoriginalestimate,
            overflowTime:customFields.OverflowTime
        }
    
        return issueData;
      }
} 