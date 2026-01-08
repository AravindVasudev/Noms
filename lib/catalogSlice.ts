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

const clearAllAsync = createAsyncThunk('catalog/clearAll', async () => {
  await catalogStore.dropTable();
  await catalogStore.init();
  return [];
});

const setCatalog = createAsyncThunk('catalog/setCatalog', async (data: { catalog: CatalogRow[] }) => {
  await catalogStore.dropTable();
  await catalogStore.init();
  const insertedItems = [];
  for (const item of data.catalog) {
    // Remove id field as it will be auto-generated
    const { id, ...itemWithoutId } = item;
    const insertId = await catalogStore.insertEntry(itemWithoutId as any);
    insertedItems.push({ ...itemWithoutId, id: insertId });
  }
  return insertedItems;
});

const catalogSlice = createSlice({
  name: 'catalog',
  initialState: { catalog: [] as CatalogRow[] },
  reducers: {},
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
      })
      .addCase(clearAllAsync.fulfilled, (state, action) => {
        state.catalog = action.payload;
      })
      .addCase(setCatalog.fulfilled, (state, action) => {
        state.catalog = action.payload;
      });
  },
});

export { addCatalogItemAsync, clearAllAsync, initializeCatalog, removeCatalogItemAsync, setCatalog };
export default catalogSlice.reducer;
