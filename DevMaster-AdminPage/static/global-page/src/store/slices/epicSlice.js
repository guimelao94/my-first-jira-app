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
    error: null
  },
  reducers:{
    setDevelopers(state,action){
      console.log(action.payload);
      state.Developers = action.payload;
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
      if (action.payload){
        state.data.push(action.payload);
      }
    });
    builder.addCase(ProcessEpic.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error;
    });


    //Generate IssueData
    builder.addCase(GenerateIssueData.pending, (state, action) => {
      state.isLoading = true;
    });
    builder.addCase(GenerateIssueData.fulfilled, (state, action) => {
      state.processed = true;
      state.isLoading = false;
      if (action.payload){
        state.issues.push(action.payload);
        if(state.Selected.length > 0 && state.data.reduce((accumulator, item) => {
          return accumulator + item.Issues.length;
        }, 0) === state.issues.length){
          state.loaded = true;
        }
      }
    });
    builder.addCase(GenerateIssueData.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error;
    });

  }
});
export const { setDevelopers } = epicsSlice.actions;
export const epicsReducer = epicsSlice.reducer;
