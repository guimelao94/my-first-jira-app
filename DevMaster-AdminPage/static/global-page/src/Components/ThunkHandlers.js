import { useDispatch } from "react-redux";
import { fetchAvailableEpics, fetchSelectedEpics, GenerateIssueData, ProcessEpic } from "../store";

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
            for (let idx = 0; idx < epic.payload.Issues.length; idx++) {
                const issue = epic.payload.Issues[idx];
                console.log(issue);
                console.log(idx);
                const issueData = await dispatch(GenerateIssueData({item:issue, index:idx}));
                console.log(issueData);
            }
        }
    }
}