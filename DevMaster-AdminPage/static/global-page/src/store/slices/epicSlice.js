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
    AllDevStacksLoaded:false
  },
  reducers: {
    setDevelopers(state, action) {
      state.loaded = false;
      console.log(action.payload);
      state.Developers = action.payload;
      if (state.data && !state.data.some(x => x.Developers == null) && state.data.length === state.Selected.length && state.Developers.length > 0) {
        console.log('loaded');
        state.loaded = true;
      }

    },
    reOrderEpics(state, action) {
      state.data.sort((a, b) => new Date(a.DueDate) - new Date(b.DueDate));
    },
    setEpicDevStack(state,action){
        HandleDevStacks(state);
    },
    setEpicDevelopers(state, action) {
      state.loaded = false;
      const idx = state.data.indexOf(x => x.EpicKey === action.payload.EpicKey);
      console.log(action.payload);
      for (let epic of state.data) {
        if (epic.EpicKey === action.payload.EpicKey) {
          epic.Developers = action.payload.Developers;
        }
      }
      console.log(!state.data.some(x => x.Developers == null));
      console.log(state.data.length);
      console.log(state.Developers ? state.Developers.length:0);
      if (state.data && !state.data.some(x => x.Developers == null) && state.Developers && state.Developers.length > 0) {
        console.log('DevelopersFull');
        state.DevelopersFull = groupByDevs(state.issues,'dev');
        console.log('loaded');
        state.loaded = true;
      }
    },
    setIssueData(state, action) {
      state.processed = true;
      state.isLoading = false;
      const sumOverflow = (issue) =>{
        console.log(issue);
        if(!issue.overflowTime || issue.overflowTime.length == 0) return 0;
        var sum = issue.overflowTime.reduce((total, item) => total + (item.TimeSpent  || 0),0);
        console.log(sum);
        return sum;
      }
      if (action.payload) {
        console.log(action.payload);
        if(state.issues == null) state.issues = [];
        state.issues.push(...action.payload);
        for (var epic of state.data) {
          if (epic.EpicKey == action.payload[0].EpicKey) {
              epic.TimeRemaining = convertToHours(action.payload.reduce((total, item) => total + (item['remainingTime'] || 0), 0));
              epic.TimeSpent = convertToHours(action.payload.reduce((total, item) => total + (item['timespent'] || 0), 0));
              epic.OriginalEstimate = convertToHours(action.payload.reduce((total, item) => total + (item['originalestimate'] || 0), 0));
              epic.OverflowTime = convertToHours(action.payload.reduce((total, item) => total + sumOverflow(item), 0));
              epic.Developers = groupByDevs(action.payload,'dev');
              epic.loaded = true;
          }
        }
        const totalIssues = state.data.reduce((accumulator, item) => {
          return accumulator + item.Issues.length;
        }, 0);
        console.log(totalIssues);
        console.log(state.issues.length);
        if (state.Selected.length > 0 && totalIssues === state.issues.length) {
          console.log('AllIssuesLoaded');
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
      console.log(action.payload);
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
export const { setDevelopers, setEpicDevelopers, setIssueData, setDevHours, reOrderEpics,setEpicDevStack } = epicsSlice.actions;
export const epicsReducer = epicsSlice.reducer;
