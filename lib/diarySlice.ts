import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import journalStore from './journal-store';

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

const removeEntryAsync = createAsyncThunk('diary/removeEntry', async (id: number) => {
  await journalStore.deleteEntryById(id);
  return id;
});

const clearAllAsync = createAsyncThunk('diary/clearAll', async () => {
  await journalStore.dropTable();
  await journalStore.init();
  return [];
});

const diarySlice = createSlice({
  name: 'diary',
  initialState: { diary: [] as Nutrition[] },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(initializeDiary.fulfilled, (state, action) => {
        state.diary = action.payload;
      })
      .addCase(addEntryAsync.fulfilled, (state, action) => {
        state.diary.push(action.payload);
      })
      .addCase(removeEntryAsync.fulfilled, (state, action) => {
        const id = action.payload;
        const index = state.diary.findIndex(entry => entry.id === id);
        if (index !== -1) {
          state.diary.splice(index, 1);
        }
      })
      .addCase(clearAllAsync.fulfilled, (state, action) => {
        state.diary = action.payload;
      });
  },
});

export { addEntryAsync, clearAllAsync, initializeDiary, removeEntryAsync };
export default diarySlice.reducer;