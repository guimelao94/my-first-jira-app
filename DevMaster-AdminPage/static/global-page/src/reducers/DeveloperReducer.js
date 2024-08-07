import { RefreshDevelopersList, SaveDevelopersList, UpdateHours } from "./Functions/Developers";

export const DevelopersInitialValue = {
    Available:[],
    AvailableLoaded:false,
    AvailableSaved:false
}

export const DeveloperReducer = (state,action) =>{
    switch (action.type) {
        case 'SAVE-AVAILABLE':
            try {
                SaveDevelopersList(actions.payload);
                state.AvailableSaved = true;
                return {...state,Success:true};
            } catch (error) {
                return {...state,Error:error,Success:false};
            }
        case 'UPDATE-HOURS':
            try {
                UpdateHours(actions.payload,state.Available);
                return {...state,Success:true};
            } catch (error) {
                return {...state,Error:error,Success:false};
            }
        case 'REFRESH-LIST':
            try {
                state.Available = RefreshDevelopersList(actions.payload);
                state.AvailableLoaded = true;
                return {...state,Success:true};
            } catch (error) {
                return {...state,Error:error,Success:false};
            }
        default:
            break;
    }
}