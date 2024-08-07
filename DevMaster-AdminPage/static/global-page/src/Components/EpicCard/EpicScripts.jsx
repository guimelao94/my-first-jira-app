import { convertToHours } from '../../Utils/ConversionTools';
import { groupByDevs } from '../../Utils/GroupingTools';
import { invoke, requestJira } from '@forge/bridge';



export const RefreshData = (issuesList, setDevelopers, setIssues, setLoaded, setCardData, developersList, setDevelopersList,devStackData,setDevStackData) => {
  if (issuesList.length > 0) {
    var devs = [];
    devs = groupByDevs(issuesList, 'dev');
    var devsList = RefreshDevelopersList(devs,setDevelopersList);

    console.log(issuesList);
    console.log(devs);
    setDevelopers(devs);
    setIssues(issuesList);
    setCardData((prev) => ({
      ...prev,
      TimeRemaining: convertToHours(devs.reduce((total, item) => total + (item['RemainingWork'] || 0), 0)),
      TimeSpent: convertToHours(devs.reduce((total, item) => total + (item['TimeSpent'] || 0), 0)),
      OriginalEstimate: convertToHours(devs.reduce((total, item) => total + (item['OriginalEstimate'] || 0), 0)),
      OverflowTime: convertToHours(devs.reduce((total, item) => total + (item['OverflowTime'] || 0), 0))
    }));
    console.log(issuesList)
    setLoaded(true);
  }
}



export const GetStorage = async (item, setLoadedStorage) => {
  const data = await invoke('Storage.GetData2', { key: item.key });
  setLoadedStorage(true);
  return data;
}



