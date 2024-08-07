import { invoke, requestJira } from "@forge/bridge";

export const GetEpics = async () => {
    const res = await requestJira(`/rest/api/3/search?jql=issueType=Epic`);

    const data = await res.json();

    var epicList = data.issues.map((item) => ({
        label: item.key,
        value: item.key
    }));

    console.log(data);
    console.log(epicList);

    return epicList;
};

export const SaveSelectedEpics = async (newArray) => {
    invoke('Storage.SaveData', { key: 'Cards', value: newArray }).then((returnedData) => {
        console.log(returnedData);
    });
}

export const HandleEpics = async (epicKey, setCardData, setStorage, storage) => {
    var devs = [];
    var issuesList = [];

    console.log(epicKey);
    const res = await requestJira(`/rest/api/3/issue/${epicKey}`);

    const data = await res.json();

    console.log(data);

    if (data.fields.issuetype.name == "Epic") {
        const jql = await requestJira(`/rest/api/3/search?jql=parent=${epicKey}`);
        await jql.json().then((returnedData) => {
            console.log(returnedData);
            returnedData.issues.map((item, index) => (GenerateIssueData(item, index, returnedData.issues.length, issuesList, setStorage, storage)));
            setCardData((prev) => ({
                ...prev,
                EpicKey: epicKey,
                DueDate: data.fields.duedate,
                IssueType: data.fields.issuetype.name
            }));
        });
    }
    return "";
}