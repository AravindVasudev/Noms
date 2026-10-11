// TDEE (Total Daily Energy Expenditure) calculations.
// Mirrors tdeecalculator.net: Mifflin-St Jeor by default, Katch-McArdle when
// body fat % is known, standard activity multipliers, flat +/-500 cal goals.

export type Gender = 'male' | 'female';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'heavy' | 'athlete';

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  heavy: 1.725,
  athlete: 1.9,
};

export const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; hint: string }[] = [
  { value: 'sedentary', label: 'Sedentary', hint: 'office job, little exercise' },
  { value: 'light', label: 'Light Exercise', hint: '1-2 days/week' },
  { value: 'moderate', label: 'Moderate Exercise', hint: '3-5 days/week' },
  { value: 'heavy', label: 'Heavy Exercise', hint: '6-7 days/week' },
  { value: 'athlete', label: 'Athlete', hint: '2x per day' },
];

export type MacroSplitKey = 'moderate' | 'low' | 'high';

export const MACRO_SPLITS: Record<
  MacroSplitKey,
  { label: string; description: string; proteinPct: number; carbsPct: number; fatPct: number }
> = {
  moderate: {
    label: 'Moderate Carb',
    description: '30% protein / 35% carbs / 35% fat',
    proteinPct: 0.3,
    carbsPct: 0.35,
    fatPct: 0.35,
  },
  low: {
    label: 'Low Carb',
    description: '40% protein / 20% carbs / 40% fat',
    proteinPct: 0.4,
    carbsPct: 0.2,
    fatPct: 0.4,
  },
  high: {
    label: 'High Carb',
    description: '30% protein / 50% carbs / 20% fat',
    proteinPct: 0.3,
    carbsPct: 0.5,
    fatPct: 0.2,
  },
};

export type GoalKey = 'maintenance' | 'cutting' | 'bulking';

export const GOAL_OPTIONS: { value: GoalKey; label: string; delta: number }[] = [
  { value: 'maintenance', label: 'Maintenance', delta: 0 },
  { value: 'cutting', label: 'Cutting', delta: -500 },
  { value: 'bulking', label: 'Bulking', delta: 500 },
];

export type MacroGrams = { protein: number; carbs: number; fat: number; fiber: number };

export const lbsToKg = (lbs: number) => lbs * 0.45359237;
export const inchesToCm = (inches: number) => inches * 2.54;
export const ftInToCm = (feet: number, inches: number) => (feet * 12 + inches) * 2.54;

export function computeBMR(args: {
  age: number;
  gender: Gender;
  weightKg: number;
  heightCm: number;
  bodyFatPct?: number | null;
}): number {
  const { age, gender, weightKg, heightCm, bodyFatPct } = args;
  if (bodyFatPct != null && bodyFatPct > 0 && bodyFatPct < 100) {
    const leanMassKg = weightKg * (1 - bodyFatPct / 100);
    return 370 + 21.6 * leanMassKg;
  }
  const s = gender === 'male' ? 5 : -161;
  return 10 * weightKg + 6.25 * heightCm - 5 * age + s;
}

export function computeTDEE(bmr: number, activity: ActivityLevel): number {
  return bmr * ACTIVITY_MULTIPLIERS[activity];
}

export function calorieTargets(tdee: number): Record<GoalKey, number> {
  return {
    maintenance: Math.round(tdee),
    cutting: Math.round(tdee - 500),
    bulking: Math.round(tdee + 500),
  };
}

export function macroGrams(calories: number, split: MacroSplitKey): MacroGrams {
  const { proteinPct, carbsPct, fatPct } = MACRO_SPLITS[split];
  return {
    protein: Math.round((calories * proteinPct) / 4),
    carbs: Math.round((calories * carbsPct) / 4),
    fat: Math.round((calories * fatPct) / 9),
    fiber: Math.round((calories * 14) / 1000),
  };
}

export type TdeeResult = {
  bmr: number;
  tdee: number;
  targets: Record<GoalKey, number>;
  macros: Record<GoalKey, Record<MacroSplitKey, MacroGrams>>;
  usedKatchMcArdle: boolean;
};

export function computeTdeeResult(args: {
  age: number;
  gender: Gender;
  weightKg: number;
  heightCm: number;
  activity: ActivityLevel;
  bodyFatPct?: number | null;
}): TdeeResult {
  const bmr = computeBMR(args);
  const tdee = computeTDEE(bmr, args.activity);
  const targets = calorieTargets(tdee);
  const macros = {
    maintenance: {
      moderate: macroGrams(targets.maintenance, 'moderate'),
      low: macroGrams(targets.maintenance, 'low'),
      high: macroGrams(targets.maintenance, 'high'),
    },
    cutting: {
      moderate: macroGrams(targets.cutting, 'moderate'),
      low: macroGrams(targets.cutting, 'low'),
      high: macroGrams(targets.cutting, 'high'),
    },
    bulking: {
      moderate: macroGrams(targets.bulking, 'moderate'),
      low: macroGrams(targets.bulking, 'low'),
      high: macroGrams(targets.bulking, 'high'),
    },
  } satisfies Record<GoalKey, Record<MacroSplitKey, MacroGrams>>;
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targets,
    macros,
    usedKatchMcArdle: args.bodyFatPct != null && args.bodyFatPct > 0 && args.bodyFatPct < 100,
  };
}
