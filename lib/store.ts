import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import diaryReducer from './diarySlice';
import goalsReducer from './goalsSlice';
import profileReducer from './profileSlice';

const store = configureStore({
  reducer: {
    diary: diaryReducer,
    goals: goalsReducer,
    profile: profileReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;