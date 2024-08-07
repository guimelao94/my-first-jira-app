import { configureStore } from '@reduxjs/toolkit';
import { epicsReducer } from './slices/epicSlice';

export const store = configureStore({
  reducer: {
    epics: epicsReducer,
  },
});

export * from './thunks/EpicsThunks';
