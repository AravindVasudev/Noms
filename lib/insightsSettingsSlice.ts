import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

export type InsightMetricId = 'calories' | 'protein' | 'fiber' | 'fat' | 'carbs' | 'weight';

export type InsightsSettings = {
  order: InsightMetricId[];
  visible: Record<InsightMetricId, boolean>;
};

const STORAGE_KEY = 'insights-settings';

export const DEFAULT_ORDER: InsightMetricId[] = ['calories', 'protein', 'fiber', 'fat', 'carbs', 'weight'];

const DEFAULT_VISIBLE: Record<InsightMetricId, boolean> = {
  calories: true,
  protein: true,
  fiber: true,
  fat: true,
  carbs: true,
  weight: true,
};

export const DEFAULT_INSIGHTS_SETTINGS: InsightsSettings = {
  order: [...DEFAULT_ORDER],
  visible: { ...DEFAULT_VISIBLE },
};

function sanitizeSettings(raw: unknown): InsightsSettings {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_INSIGHTS_SETTINGS, order: [...DEFAULT_ORDER], visible: { ...DEFAULT_VISIBLE } };
  const parsed = raw as Partial<InsightsSettings>;
  const seen = new Set<InsightMetricId>();
  const order: InsightMetricId[] = [];
  if (Array.isArray(parsed.order)) {
    for (const id of parsed.order) {
      if (DEFAULT_ORDER.includes(id as InsightMetricId) && !seen.has(id as InsightMetricId)) {
        seen.add(id as InsightMetricId);
        order.push(id as InsightMetricId);
      }
    }
  }
  // Append any missing metrics (forward-compat / corrupt data) at the end.
  for (const id of DEFAULT_ORDER) {
    if (!seen.has(id)) order.push(id);
  }
  const visible: Record<InsightMetricId, boolean> = { ...DEFAULT_VISIBLE };
  if (parsed.visible && typeof parsed.visible === 'object') {
    for (const id of DEFAULT_ORDER) {
      const v = (parsed.visible as Record<string, unknown>)[id];
      if (typeof v === 'boolean') visible[id] = v;
    }
  }
  return { order, visible };
}

const initializeInsightsSettings = createAsyncThunk('insightsSettings/initialize', async () => {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (!stored) return DEFAULT_INSIGHTS_SETTINGS;
  try {
    return sanitizeSettings(JSON.parse(stored));
  } catch {
    return DEFAULT_INSIGHTS_SETTINGS;
  }
});

const persist = async (settings: InsightsSettings) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};

const setMetricVisibleAsync = createAsyncThunk(
  'insightsSettings/setMetricVisible',
  async ({ id, visible, current }: { id: InsightMetricId; visible: boolean; current: InsightsSettings }) => {
    const next: InsightsSettings = { order: [...current.order], visible: { ...current.visible, [id]: visible } };
    await persist(next);
    return next;
  },
);

const setInsightsOrderAsync = createAsyncThunk(
  'insightsSettings/setOrder',
  async ({ order, current }: { order: InsightMetricId[]; current: InsightsSettings }) => {
    const next: InsightsSettings = sanitizeSettings({ order, visible: current.visible });
    await persist(next);
    return next;
  },
);

const setInsightsSettingsAsync = createAsyncThunk('insightsSettings/setAll', async (settings: InsightsSettings) => {
  const next = sanitizeSettings(settings);
  await persist(next);
  return next;
});

const setInsightsSettings = createAsyncThunk('insightsSettings/restore', async (settings: InsightsSettings) => {
  const next = sanitizeSettings(settings);
  await persist(next);
  return next;
});

const clearAllAsync = createAsyncThunk('insightsSettings/clearAll', async () => {
  await AsyncStorage.removeItem(STORAGE_KEY);
  return DEFAULT_INSIGHTS_SETTINGS;
});

const insightsSettingsSlice = createSlice({
  name: 'insightsSettings',
  initialState: DEFAULT_INSIGHTS_SETTINGS as InsightsSettings,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(initializeInsightsSettings.fulfilled, (state, action) => {
        return action.payload;
      })
      .addCase(setMetricVisibleAsync.fulfilled, (state, action) => {
        return action.payload;
      })
      .addCase(setInsightsOrderAsync.fulfilled, (state, action) => {
        return action.payload;
      })
      .addCase(setInsightsSettingsAsync.fulfilled, (state, action) => {
        return action.payload;
      })
      .addCase(setInsightsSettings.fulfilled, (state, action) => {
        return action.payload;
      })
      .addCase(clearAllAsync.fulfilled, (state, action) => {
        return action.payload;
      });
  },
});

export {
  clearAllAsync,
  initializeInsightsSettings,
  setInsightsOrderAsync,
  setInsightsSettings,
  setInsightsSettingsAsync,
  setMetricVisibleAsync,
};
export default insightsSettingsSlice.reducer;
