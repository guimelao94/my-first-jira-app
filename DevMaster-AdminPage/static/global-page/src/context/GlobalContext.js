import { createContext, useEffect, useReducer, useState } from "react";
import {produce} from "immer"
import useGlobal from "../hooks/useGlobal";
import { EpicReducer, EpicInitialValue } from "../reducers/EpicReducer";
import { DeveloperReducer, DevelopersInitialValue } from "../reducers/DeveloperReducer";

const GlobalContext = createContext();

export const GlobalContextProvider = ({ children }) => {
    const [DeveloperState,DeveloperDispatch]=useReducer(produce(DeveloperReducer),DevelopersInitialValue)
    const [EpicState,EpicDispatch]=useReducer(produce(EpicReducer),EpicInitialValue)

    useEffect(() => {
       console.log(EpicDispatch({type:'GET-AVAILABLE'}));
       console.log(EpicDispatch({type:'GET-SELECTED'}));
       
    }, []);

    useEffect(() => {
        console.log(EpicState.Available);
        
     }, [EpicState.AvailableLoaded]);

     useEffect(() => {
        console.log(EpicState.Selected);
        
     }, [EpicState.SelectedLoaded]);
    return (
    <GlobalContext.Provider value={
        {Epics:{
            State:EpicState,
            Dispatch:EpicDispatch
        },
        Developers:{
            State:DeveloperState,
            Dispatch:DeveloperDispatch
        }}}>
            {children}
    </GlobalContext.Provider>
    );
}
export default GlobalContext;