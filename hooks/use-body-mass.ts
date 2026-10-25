import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import type { QuantitySampleTyped } from '@kingstinct/react-native-healthkit';
import { formatDateKey } from '@/lib/date';
import { loadWeightUnit, saveWeightUnit, WeightUnit } from '@/lib/weight';

const BODY_MASS_ID = 'HKQuantityTypeIdentifierBodyMass' as const;
/** Always fetch the full chart window; Insights slices per duration. */
const FETCH_DAYS = 30;

export type BodyMassStatus = 'loading' | 'ready' | 'unavailable';

export type BodyMassState = {
  status: BodyMassStatus;
  /** Latest sample, kilograms. Null unless status is 'ready'. */
  latestKg: number | null;
  latestDate: Date | null;
  /** Day key (YYYY-MM-DD) → latest sample that day, kilograms. */
  byDayKg: Record<string, number>;
  unit: WeightUnit;
  setUnit: (unit: WeightUnit) => void;
};

type HealthKitModule = {
  isHealthDataAvailable: () => boolean;
  requestAuthorization: (req: { toRead: readonly string[] }) => Promise<boolean>;
  queryQuantitySamples: (
    identifier: string,
    options: {
      limit: number;
      ascending?: boolean;
      unit?: string;
      filter?: { date?: { startDate?: Date; endDate?: Date } };
    },
  ) => Promise<readonly QuantitySampleTyped<typeof BODY_MASS_ID>[]>;
};

function loadHealthKit(): HealthKitModule | null {
  if (Platform.OS !== 'ios') return null;
  try {
    // Lazy require: the native module only exists in a dev-client/prebuild
    // build with the HealthKit plugin. Never crash at import time — any
    // failure means the weight section stays hidden (silent-hide).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@kingstinct/react-native-healthkit') as HealthKitModule;
  } catch {
    return null;
  }
}

export function useBodyMass(): BodyMassState {
  const [status, setStatus] = useState<BodyMassStatus>('loading');
  const [latestKg, setLatestKg] = useState<number | null>(null);
  const [latestDate, setLatestDate] = useState<Date | null>(null);
  const [byDayKg, setByDayKg] = useState<Record<string, number>>({});
  const [unit, setUnitState] = useState<WeightUnit>('kg');

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const load = async () => {
        const HK = loadHealthKit();
        if (!HK) {
          if (!cancelled) setStatus('unavailable');
          return;
        }
        try {
          if (!HK.isHealthDataAvailable()) {
            if (!cancelled) setStatus('unavailable');
            return;
          }
          const authorized = await HK.requestAuthorization({ toRead: [BODY_MASS_ID] });
          if (!authorized || cancelled) {
            if (!cancelled) setStatus('unavailable');
            return;
          }
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - FETCH_DAYS);
          // Query in kg (HealthKit converts); display unit applied at render.
          // limit 0 = no limit. Ascending so the last sample per day wins.
          const samples = await HK.queryQuantitySamples(BODY_MASS_ID, {
            limit: 0,
            ascending: true,
            unit: 'kg',
            filter: { date: { startDate } },
          });
          if (cancelled) return;
          if (samples.length === 0) {
            setStatus('unavailable');
            return;
          }
          const byDay: Record<string, number> = {};
          for (const s of samples) {
            byDay[formatDateKey(new Date(s.startDate))] = s.quantity;
          }
          const last = samples[samples.length - 1];
          setByDayKg(byDay);
          setLatestKg(last.quantity);
          setLatestDate(new Date(last.startDate));
          setUnitState(await loadWeightUnit());
          setStatus('ready');
        } catch {
          if (!cancelled) setStatus('unavailable');
        }
      };

      load();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const setUnit = useCallback((next: WeightUnit) => {
    setUnitState(next);
    void saveWeightUnit(next);
  }, []);

  return { status, latestKg, latestDate, byDayKg, unit, setUnit };
}
