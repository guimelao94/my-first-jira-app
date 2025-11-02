import { createSlice } from '@reduxjs/toolkit';
import { fetchSelectedEpics, fetchAvailableEpics, ProcessEpic, SaveSelectedEpics } from '../thunks/EpicsThunks';
import { convertToHours } from '../../Utils/ConversionTools';
import { groupByDevs } from '../../Utils/GroupingTools';
import { HandleDevStacks } from './Functions/DevStack';

const epicsSlice = createSlice({
  name: 'epics',
  initialState: {
    Available: null,
    Selected: null,
    data: null,
    issues: null,
    Developers: null,
    DevelopersFull:null,
    SaveDevCounter: 0,
    isLoading: false,
    loaded: false,
    AllIssuesLoaded: false,
    error: null,
    reloadCounter: 0,
    AllDevStacksLoaded:false,
    Holidays:null
  },
  reducers: {
    setDevelopers(state, action) {
      state.loaded = false;
      state.Developers = action.payload;
      if (state.data && 
          state.data.length > 0 && 
          state.data.every(x => x.Developers != null) && 
          state.data.length === state.Selected.length && 
          state.Developers.length > 0) {
        state.loaded = true;
      }
    },
    reOrderEpics(state, action) {
      if(state.data){
        state.data.sort((a, b) => new Date(a.DueDate) - new Date(b.DueDate));
      }
    },
    setHolidays(state, action) {
      state.Holidays = action.payload;
    },
    setEpicDevStack(state,action){
        HandleDevStacks(state);
    },
    setEpicDevelopers(state, action) {
      state.loaded = false;
      const epic = state.data?.find(x => x.EpicKey === action.payload.EpicKey);
      if (epic) {
        epic.Developers = action.payload.Developers;
      }
      
      if (state.data && 
          state.data.every(x => x.Developers != null) && 
          state.Developers && 
          state.Developers.length > 0) {
        state.DevelopersFull = groupByDevs(state.issues,'dev');
        state.loaded = true;
      }
    },
    setIssueData(state, action) {
      state.processed = true;
      state.isLoading = false;
      
      const sumOverflow = (issue) => {
        if(!issue.overflowTime || issue.overflowTime.length === 0) return 0;
        return issue.overflowTime.reduce((total, item) => total + (item.TimeSpent || 0), 0);
      };
      
      if (action.payload && action.payload.length > 0) {
        if(state.issues == null) state.issues = [];
        state.issues.push(...action.payload);
        
        const epicKey = action.payload[0].EpicKey;
        const epic = state.data?.find(e => e.EpicKey === epicKey);
        
        if (epic) {
          const payloadIssues = action.payload;
          epic.TimeRemaining = convertToHours(payloadIssues.reduce((total, item) => total + (item['remainingTime'] || 0), 0));
          epic.TimeSpent = convertToHours(payloadIssues.reduce((total, item) => total + (item['timespent'] || 0), 0));
          epic.OriginalEstimate = convertToHours(payloadIssues.reduce((total, item) => total + (item['originalestimate'] || 0), 0));
          epic.OverflowTime = convertToHours(payloadIssues.reduce((total, item) => total + sumOverflow(item), 0));
          epic.Developers = groupByDevs(payloadIssues,'dev');
          epic.loaded = true;
        }
        
        const totalIssues = state.data?.reduce((accumulator, item) => {
          return accumulator + (item.Issues?.length || 0);
        }, 0) || 0;
        
        if (state.Selected?.length > 0 && totalIssues === state.issues.length) {
          state.AllIssuesLoaded = true;
        }
      }
    },
    setDevHours(state, action) {
      state.Developers = action.payload;
      state.data = null;
      state.issues = [];
      state.DevelopersFull = [];
      state.SaveDevCounter++;
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

    //Save Selected Epics
    builder.addCase(SaveSelectedEpics.pending, (state, action) => {
      //state.DropDown.isLoadingSelected = true;
    });
    builder.addCase(SaveSelectedEpics.fulfilled, (state, action) => {
      //state.DropDown.isLoadingSelected = false;
      state.data = null;
      state.issues = [];
      state.Developers = [];
      state.DevelopersFull = [];
      state.AllDevStacksLoaded = false;
      state.reloadCounter++;
      //state.reload = true;
      //state.AllIssuesLoaded = false;
    });
    builder.addCase(SaveSelectedEpics.rejected, (state, action) => {
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
      if (action.payload) {
        if(state.data == null) state.data = [];
        state.data.push(action.payload);
      }
    });
    builder.addCase(ProcessEpic.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error;
    });

  }
});
export const { setDevelopers, setEpicDevelopers, setIssueData, setDevHours, reOrderEpics,setEpicDevStack,setHolidays } = epicsSlice.actions;
export const epicsReducer = epicsSlice.reducer;
