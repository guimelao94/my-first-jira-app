import { createSlice } from '@reduxjs/toolkit';
import { fetchSelectedEpics, fetchAvailableEpics, ProcessEpic, GenerateIssueData } from '../thunks/EpicsThunks';

const epicsSlice = createSlice({
  name: 'epics',
  initialState: {
    Available: [],
    Selected:[],
    data:[],
    issues:[],
    Developers:[],
    isLoading: false,
    loaded:false,
    AllIssuesLoaded:false,
    error: null
  },
  reducers:{
    setDevelopers(state,action){
      state.loaded = false;
      console.log(action.payload);
      state.Developers = action.payload;
      if(!state.data.some(x=>x.Developers == null) && state.data.length === state.Selected.length && state.Developers.length > 0) {
        console.log('loaded');
        state.loaded = true;
      }

    },
    setEpicDevelopers(state,action){
      state.loaded = false;
      const idx = state.data.indexOf(x=>x.EpicKey === action.payload.EpicKey);
      console.log(action.payload);
      for (let epic of state.data) {
        if(epic.EpicKey === action.payload.EpicKey){
          epic.Developers = action.payload.Developers;          
        }
      }
        console.log(state.data.filter(x=>x.Developers == null));
        if(!state.data.some(x=>x.Developers == null) && state.data.length === state.Selected.length && state.Developers.length > 0) {
          console.log('loaded');
          state.loaded = true;
        }
    },
    setIssueData(state, action) {
      state.processed = true;
      state.isLoading = false;
      if (action.payload){
        state.issues.push(...action.payload);
        const totalIssues = state.data.reduce((accumulator, item) => {
          return accumulator + item.Issues.length;
        }, 0);
        console.log(totalIssues);
        console.log(state.issues.length);
        if(state.Selected.length > 0 && totalIssues === state.issues.length && state.data.length === state.Selected.length){
          console.log('AllIssuesLoaded');
          state.AllIssuesLoaded = true;
        }
      }
    }
  },
  extraReducers(builder) {
    //Fetch Available Epics
    builder.addCase(fetchAvailableEpics.pending, (state, action) => {
      //state.DropDown.isLoadingAvailable = true;
    });
    builder.addCase(fetchAvailableEpics.fulfilled, (state, action) => {
      //state.DropDown.isLoadingAvailable = false;
      state.Available = action.payload;
    });
    builder.addCase(fetchAvailableEpics.rejected, (state, action) => {
      //state.DropDown.isLoadingAvailable = false;
      state.error = action.error;
    });

    //Fetch Selected Epics
    builder.addCase(fetchSelectedEpics.pending, (state, action) => {
      //state.DropDown.isLoadingSelected = true;
    });
    builder.addCase(fetchSelectedEpics.fulfilled, (state, action) => {
      //state.DropDown.isLoadingSelected = false;
      state.Selected = action.payload;
    });
    builder.addCase(fetchSelectedEpics.rejected, (state, action) => {
      //state.DropDown.isLoadingSelected = false;
      state.error = action.error;
    });

    //Process Epics
    builder.addCase(ProcessEpic.pending, (state, action) => {
      state.isLoading = true;
    });
    builder.addCase(ProcessEpic.fulfilled, (state, action) => {
      state.processed = true;
      state.isLoading = false;
      console.log(action.payload);
      if (action.payload){
        state.data.push(action.payload);
      }
    });
    builder.addCase(ProcessEpic.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error;
    });

  }
});
export const { setDevelopers,setEpicDevelopers,setIssueData } = epicsSlice.actions;
export const epicsReducer = epicsSlice.reducer;
