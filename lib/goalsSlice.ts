import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

export type Goals = {
  calories: string;
  protein: string;
  fiber: string;
  fat: string;
  carbs: string;
};

const initializeGoals = createAsyncThunk('goals/initialize', async () => {
  const goals = {
    calories: await AsyncStorage.getItem('goal-calories') || '',
    protein: await AsyncStorage.getItem('goal-protein') || '',
    fiber: await AsyncStorage.getItem('goal-fiber') || '',
    fat: await AsyncStorage.getItem('goal-fat') || '',
    carbs: await AsyncStorage.getItem('goal-carbs') || '',
  };
  return goals;
});

const setGoalsAsync = createAsyncThunk('goals/setGoals', async (goals: Goals) => {
  if (goals.calories.trim()) await AsyncStorage.setItem('goal-calories', goals.calories);
  if (goals.protein.trim()) await AsyncStorage.setItem('goal-protein', goals.protein);
  if (goals.fiber.trim()) await AsyncStorage.setItem('goal-fiber', goals.fiber);
  if (goals.fat.trim()) await AsyncStorage.setItem('goal-fat', goals.fat);
  if (goals.carbs.trim()) await AsyncStorage.setItem('goal-carbs', goals.carbs);
  return goals;
});

const clearAllAsync = createAsyncThunk('goals/clearAll', async () => {
  await AsyncStorage.multiRemove(['goal-calories', 'goal-protein', 'goal-fiber', 'goal-fat', 'goal-carbs']);
  return { calories: '', protein: '', fiber: '', fat: '', carbs: '' };
});

const goalsSlice = createSlice({
  name: 'goals',
  initialState: { calories: '', protein: '', fiber: '', fat: '', carbs: '' } as Goals,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(initializeGoals.fulfilled, (state, action) => {
        return action.payload;
      })
      .addCase(setGoalsAsync.fulfilled, (state, action) => {
        return action.payload;
      })
      .addCase(clearAllAsync.fulfilled, (state, action) => {
        return action.payload;
      })
  },
});

export { clearAllAsync, initializeGoals, setGoalsAsync };
export default goalsSlice.reducer;