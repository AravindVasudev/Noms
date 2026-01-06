import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import catalogStore, { CatalogRow } from './catalog-store';

const initializeCatalog = createAsyncThunk('catalog/initialize', async () => {
  await catalogStore.init();
  return await catalogStore.getAllEntries();
});

const addCatalogItemAsync = createAsyncThunk('catalog/addItem', async (item: Omit<CatalogRow, 'id'>) => {
  const insertId = await catalogStore.insertEntry(item as any);
  return { ...item, id: insertId } as CatalogRow;
});

const removeCatalogItemAsync = createAsyncThunk('catalog/removeItem', async (id: number) => {
  await catalogStore.deleteEntryById(id);
  return id;
});

const catalogSlice = createSlice({
  name: 'catalog',
  initialState: { catalog: [] as CatalogRow[] },
  reducers: {
    clearAll: (state) => {
      state.catalog = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeCatalog.fulfilled, (state, action) => {
        state.catalog = action.payload;
      })
      .addCase(addCatalogItemAsync.fulfilled, (state, action) => {
        state.catalog.push(action.payload);
      })
      .addCase(removeCatalogItemAsync.fulfilled, (state, action) => {
        const id = action.payload;
        const index = state.catalog.findIndex(item => item.id === id);
        if (index !== -1) {
          state.catalog.splice(index, 1);
        }
      });
  },
});

export const { clearAll } = catalogSlice.actions;
export { addCatalogItemAsync, initializeCatalog, removeCatalogItemAsync };
export default catalogSlice.reducer;
