import { createSlice } from '@reduxjs/toolkit';
import { fetchSelectedEpics, fetchAvailableEpics, ProcessEpic, SaveSelectedEpics, fetchCurrentUser, fetchUserRole, updateUserRole } from '../thunks/EpicsThunks';
import { convertToHours } from '../../Utils/ConversionTools';
import { groupByDevs } from '../../Utils/GroupingTools';
import { HandleDevStacks } from './Functions/DevStack';

const epicsSlice = createSlice({
  name: 'epics',
  initialState: {
    Available: null,
    Selected: [], // Initialize as empty array instead of null
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
    Holidays:null,
    // User management
    currentUser: null,
    userRole: 'Developer', // Default role
    isUserLoading: false
  },
  reducers: {
    setDevelopers(state, action) {
      state.Developers = action.payload;
      console.log('setDevelopers called:', {
        developersCount: action.payload?.length || 0,
        dataLength: state.data?.length || 0,
        selectedLength: state.Selected?.length || 0,
        allHaveDevelopers: state.data?.every(x => x.Developers != null) || false
      });
      
      // Set loaded to true if we have data, all epics have developers, and we have developers
      if (state.data && 
          state.data.length > 0 && 
          state.data.every(x => x.Developers != null) && 
          state.data.length === (state.Selected?.length || 0) && 
          state.Developers && 
          state.Developers.length > 0) {
        console.log('setDevelopers: Setting loaded = true');
        state.loaded = true;
      } else {
        console.log('setDevelopers: Conditions not met for loaded = true', {
          hasData: !!state.data,
          dataLength: state.data?.length || 0,
          selectedLength: state.Selected?.length || 0,
          allHaveDevelopers: state.data?.every(x => x.Developers != null) || false,
          hasDevelopers: !!state.Developers,
          developersLength: state.Developers?.length || 0
        });
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
    setCurrentUser(state, action) {
      state.currentUser = action.payload;
    },
    setUserRole(state, action) {
      state.userRole = action.payload;
    },
    setEpicDevStack(state,action){
        HandleDevStacks(state);
    },
    setEpicDevelopers(state, action) {
      const epic = state.data?.find(x => x.EpicKey === action.payload.EpicKey);
      if (epic) {
        epic.Developers = action.payload.Developers;
        console.log(`setEpicDevelopers: Updated epic ${action.payload.EpicKey}`, {
          hasDevelopers: !!epic.Developers,
          allEpicsHaveDevelopers: state.data?.every(x => x.Developers != null) || false,
          hasGlobalDevelopers: !!state.Developers,
          developersLength: state.Developers?.length || 0
        });
      }
      
      // Check if we should set loaded = true
      if (state.data && 
          state.data.length > 0 &&
          state.data.every(x => x.Developers != null) && 
          state.Developers && 
          state.Developers.length > 0 &&
          state.data.length === (state.Selected?.length || 0)) {
        state.DevelopersFull = groupByDevs(state.issues,'dev');
        console.log('setEpicDevelopers: Setting loaded = true');
        state.loaded = true;
      } else {
        console.log('setEpicDevelopers: Conditions not met for loaded = true', {
          hasData: !!state.data,
          dataLength: state.data?.length || 0,
          selectedLength: state.Selected?.length || 0,
          allHaveDevelopers: state.data?.every(x => x.Developers != null) || false,
          hasDevelopers: !!state.Developers,
          developersLength: state.Developers?.length || 0
        });
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
        
        // Update loaded state when we have data and issues
        if (state.data && state.data.length > 0 && state.issues && state.issues.length > 0) {
          // Check if all epics have been processed (have Developers assigned)
          const allEpicsHaveDevelopers = state.data.every(x => x.Developers != null);
          if (allEpicsHaveDevelopers && state.Developers && state.Developers.length > 0) {
            state.loaded = true;
          }
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
      // Ensure Selected is always an array
      state.Selected = Array.isArray(action.payload) ? action.payload : [];
    });
    builder.addCase(fetchSelectedEpics.rejected, (state, action) => {
      //state.DropDown.isLoadingSelected = false;
      state.Selected = []; // Set to empty array on error
      state.error = action.error;
    });

    //Save Selected Epics
    builder.addCase(SaveSelectedEpics.pending, (state, action) => {
      //state.DropDown.isLoadingSelected = true;
    });
    builder.addCase(SaveSelectedEpics.fulfilled, (state, action) => {
      //state.DropDown.isLoadingSelected = false;
      state.Selected = Array.isArray(action.payload) ? action.payload : [];
      state.data = null;
      state.issues = [];
      state.Developers = [];
      state.DevelopersFull = [];
      state.loaded = false;
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

           // User management
           builder.addCase(fetchCurrentUser.pending, (state) => {
             state.isUserLoading = true;
             state.currentUser = null;
           });
           builder.addCase(fetchCurrentUser.fulfilled, (state, action) => {
             state.currentUser = action.payload;
             state.isUserLoading = false;
             state.error = null;
           });
           builder.addCase(fetchCurrentUser.rejected, (state, action) => {
             state.isUserLoading = false;
             state.currentUser = null;
             state.error = action.error;
           });

    builder.addCase(fetchUserRole.fulfilled, (state, action) => {
      state.userRole = action.payload;
    });

    builder.addCase(updateUserRole.fulfilled, (state, action) => {
      // Role updated successfully - could refresh user list if needed
    });

  }
});
export const { setDevelopers, setEpicDevelopers, setIssueData, setDevHours, reOrderEpics,setEpicDevStack,setHolidays, setCurrentUser, setUserRole } = epicsSlice.actions;
export const epicsReducer = epicsSlice.reducer;
