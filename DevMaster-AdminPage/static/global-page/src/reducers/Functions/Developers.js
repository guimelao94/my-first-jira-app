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

