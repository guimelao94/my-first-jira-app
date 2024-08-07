import { invoke } from "@forge/bridge";
import { GetEpics, HandleEpics, SaveSelectedEpics } from "./Functions/Epics";

export const EpicInitialValue = {
    Available:[],
    AvailableLoaded:false,
    Selected:[],
    SelectedLoaded:false,
    SelectedSaved:false
}

export const EpicReducer = (state,action) =>{
    switch (action.type) {
        case 'GET-AVAILABLE':
            try {
                 GetEpics().then((returnedData) =>{
                    state.Available = returnedData;
                    state.AvailableLoaded =  true;
                    state.Success = true;
                    console.log(state.Available);
                    return;
                });                
       
            } catch (error) {
                state.Error = error;
                state.Success = false;
                return;
            }
        case 'GET-SELECTED':
            try {
                invoke('Storage.GetData', { key: 'Cards' }).then((returnedData) => {
                    console.log(returnedData);
                    var newArray = [...returnedData, ...state.Selected]
                    SaveSelectedEpics(newArray);
                    state.Selected = newArray;
                    state.SelectedLoaded = true;
                    return;
                });
                
            } catch (error) {
                state.Error = error;
                state.Success = false;
                return;
            }
        case 'SAVE-SELECTED':
            try {
                SaveSelectedEpics(actions.payload);
                state.SelectedSaved = true;
                state.Success=true;
                return;
            } catch (error) {
                state.Error = error;
                state.Success = false;
                return;
            }
        case 'HANDLE':
            try {
                HandleEpics(actions.payload);
                state.SelectedSaved = true;
                state.Success=true;
                return;
            } catch (error) {
                state.Error = error;
                state.Success = false;
                return;
            }
        
        default:
            break;
    }
}