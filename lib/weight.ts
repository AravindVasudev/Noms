import AsyncStorage from '@react-native-async-storage/async-storage';

export type WeightUnit = 'kg' | 'lb';

export const WEIGHT_UNIT_STORAGE_KEY = 'weight-unit';

export const KG_TO_LB = 2.20462;

export function convertWeightFromKg(kg: number, to: WeightUnit): number {
  return to === 'lb' ? kg * KG_TO_LB : kg;
}

/** Round to 1 decimal place for display (72.4, not 72). */
export function roundWeight(value: number): number {
  return Math.round(value * 10) / 10;
}

export function formatWeight(kg: number, unit: WeightUnit): string {
  return `${roundWeight(convertWeightFromKg(kg, unit))}`;
}

export async function loadWeightUnit(): Promise<WeightUnit> {
  try {
    const stored = await AsyncStorage.getItem(WEIGHT_UNIT_STORAGE_KEY);
    return stored === 'lb' ? 'lb' : 'kg';
  } catch {
    return 'kg';
  }
}

export async function saveWeightUnit(unit: WeightUnit): Promise<void> {
  try {
    await AsyncStorage.setItem(WEIGHT_UNIT_STORAGE_KEY, unit);
  } catch {
    // Non-fatal: unit preference just won't persist.
  }
}
