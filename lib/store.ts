import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import appearanceReducer from './appearanceSlice';
import catalogReducer from './catalogSlice';
import diaryReducer from './diarySlice';
import goalsReducer from './goalsSlice';
import insightsSettingsReducer from './insightsSettingsSlice';
import profileReducer from './profileSlice';
import trainingReducer from './trainingSlice';

const store = configureStore({
  reducer: {
    appearance: appearanceReducer,
    diary: diaryReducer,
    goals: goalsReducer,
    profile: profileReducer,
    catalog: catalogReducer,
    insightsSettings: insightsSettingsReducer,
    training: trainingReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;