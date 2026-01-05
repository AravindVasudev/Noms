import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import journalStore from '../components/journal-store';

export type Nutrition = {
  id?: number;
  name: string;
  calories: number | null;
  fat: number | null;
  protein: number | null;
  carbs: number | null;
  fiber: number | null;
  date: Date;
};

const initializeDiary = createAsyncThunk('diary/initialize', async () => {
  await journalStore.init();
  return await journalStore.getAllEntries();
});

const addEntryAsync = createAsyncThunk('diary/addEntry', async (entry: Omit<Nutrition, 'id'>) => {
  const insertId = await journalStore.insertEntry(entry as any);
  return { ...entry, id: insertId } as Nutrition;
});

const removeEntryAsync = createAsyncThunk('diary/removeEntry', async (payload: { index: number; id: number }) => {
  await journalStore.deleteEntryById(payload.id);
  return payload.index;
});

const diarySlice = createSlice({
  name: 'diary',
  initialState: { diary: [] as Nutrition[] },
  reducers: {
    clearAll: (state) => {
      state.diary = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeDiary.fulfilled, (state, action) => {
        state.diary = action.payload;
      })
      .addCase(addEntryAsync.fulfilled, (state, action) => {
        state.diary.push(action.payload);
      })
      .addCase(removeEntryAsync.fulfilled, (state, action) => {
        state.diary.splice(action.payload, 1);
      });
  },
});

export const { clearAll } = diarySlice.actions;
export { addEntryAsync, initializeDiary, removeEntryAsync };
export default diarySlice.reducer;