import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

export type AppearancePreference = 'system' | 'light' | 'dark';

export type AppearanceState = {
  preference: AppearancePreference;
};

const STORAGE_KEY = 'appearance-preference';

export const DEFAULT_APPEARANCE: AppearanceState = { preference: 'system' };

function sanitizePreference(raw: unknown): AppearancePreference {
  if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  if (raw && typeof raw === 'object' && 'preference' in raw) {
    const p = (raw as { preference: unknown }).preference;
    if (p === 'light' || p === 'dark' || p === 'system') return p;
  }
  return 'system';
}

const initializeAppearance = createAsyncThunk('appearance/initialize', async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return { preference: sanitizePreference(stored) } as AppearanceState;
  } catch {
    return DEFAULT_APPEARANCE;
  }
});

const setAppearanceAsync = createAsyncThunk('appearance/set', async (preference: AppearancePreference) => {
  const next = sanitizePreference(preference);
  await AsyncStorage.setItem(STORAGE_KEY, next);
  return { preference: next } as AppearanceState;
});

const setAppearance = createAsyncThunk('appearance/restore', async (raw: unknown) => {
  const next = sanitizePreference(raw);
  await AsyncStorage.setItem(STORAGE_KEY, next);
  return { preference: next } as AppearanceState;
});

const clearAllAsync = createAsyncThunk('appearance/clearAll', async () => {
  await AsyncStorage.removeItem(STORAGE_KEY);
  return DEFAULT_APPEARANCE;
});

const appearanceSlice = createSlice({
  name: 'appearance',
  initialState: DEFAULT_APPEARANCE,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(initializeAppearance.fulfilled, (state, action) => {
        return action.payload;
      })
      .addCase(setAppearanceAsync.fulfilled, (state, action) => {
        return action.payload;
      })
      .addCase(setAppearance.fulfilled, (state, action) => {
        return action.payload;
      })
      .addCase(clearAllAsync.fulfilled, (state, action) => {
        return action.payload;
      });
  },
});

export { clearAllAsync, initializeAppearance, setAppearance, setAppearanceAsync };
export default appearanceSlice.reducer;
