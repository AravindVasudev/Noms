import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import journalStore from './journal-store';
import { DEFAULT_QUANTITY, normalizeQuantity } from './quantity';

export type Nutrition = {
  id?: number;
  name: string;
  calories: number | null;
  fat: number | null;
  protein: number | null;
  carbs: number | null;
  fiber: number | null;
  quantity: number;
  date: Date;
};

const initializeDiary = createAsyncThunk('diary/initialize', async () => {
  await journalStore.init();
  return await journalStore.getAllEntries();
});

const addEntryAsync = createAsyncThunk('diary/addEntry', async (entry: Omit<Nutrition, 'id'>) => {
  const normalized = { ...entry, quantity: normalizeQuantity((entry as any).quantity ?? DEFAULT_QUANTITY) } as Omit<Nutrition, 'id'>;
  const insertId = await journalStore.insertEntry(normalized as any);
  return { ...normalized, id: insertId } as Nutrition;
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

const setDiary = createAsyncThunk('diary/setDiary', async (data: { diary: Nutrition[] }) => {
  await journalStore.dropTable();
  await journalStore.init();
  const insertedEntries = [];
  for (const entry of data.diary) {
    // Remove id field as it will be auto-generated
    const { id, ...entryWithoutId } = entry;
    const normalized = { ...entryWithoutId, quantity: normalizeQuantity((entryWithoutId as any).quantity) } as Omit<Nutrition, 'id'>;
    // Backfill legacy dates stored as ISO strings.
    const date = normalized.date instanceof Date ? normalized.date : new Date(normalized.date as any);
    const insertId = await journalStore.insertEntry({ ...normalized, date } as any);
    insertedEntries.push({ ...normalized, date, id: insertId });
  }
  return insertedEntries;
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
      })
      .addCase(setDiary.fulfilled, (state, action) => {
        state.diary = action.payload;
      });
  },
});

export { addEntryAsync, clearAllAsync, initializeDiary, removeEntryAsync, setDiary };
export default diarySlice.reducer;