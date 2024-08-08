import { invoke } from "@forge/bridge";

export const SaveDevelopersList = async (newArray) => {
    invoke('Storage.SaveData', { key: 'DevelopersList', value: newArray }).then((returnedData) => {
        console.log(returnedData);
        forceRender();
    });
}

export const UpdateHours = (developersList,FullName,property,value) => {
    console.log(`FullName: ${FullName}`);
    console.log(`property: ${property}`);
    console.log(`value: ${value}`);

    var newArray = developersList;
    var dev = newArray.find(x=>x.FullName === FullName);
    dev[property] = value;
    console.log(newArray);
    console.log(developersList);
    SaveDevelopersList(newArray);

};

export const RefreshDevelopersList = async (devs) => {
    var devsList = devs.map((dev) =>({
      FullName:dev.FullName,
      ShortName:dev.ShortName,
      AvailableHours: 0, 
      Meetings:0, 
      DevHours:0
    }));
  
    const returnedData = await invoke('Storage.GetData', { key: 'DevelopersList' });
    if (Object.keys(returnedData).length === 0) {
      console.log('empty');
      return devsList;
    } else {
      if(devsList.length != returnedData.length){
        const unionArray = [...new Set([...devsList, ...returnedData])];
        devsList = unionArray;
      }
      else{
        devsList = returnedData;
      }
      console.log(devsList);
      return devsList;
    }
  }