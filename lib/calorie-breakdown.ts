// Atwater general factors: protein 4, carbs 4, fat 9 kcal/g.
// Soluble fiber ferments to ~2 kcal/g (insoluble ~0); 2 is the practical average.
// Fiber is a subset of total carbs on nutrition labels, so carbs are counted
// as net carbs (carbs - fiber) to avoid double-counting fiber calories.

export const KCAL_PER_G = {
  protein: 4,
  fat: 9,
  carbs: 4,
  fiber: 2,
} as const;

export type MacroTotals = {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
};

export type CalorieBreakdown = {
  proteinKcal: number;
  fatKcal: number;
  carbsKcal: number;
  fiberKcal: number;
  unknownKcal: number;
  macroKcal: number;
  consumed: number;
  goal: number | null;
  remaining: number | null;
};

export function parseGoal(goal: string): number | null {
  const n = parseFloat(goal);
  return goal && !isNaN(n) && n > 0 ? n : null;
}

export function getCalorieBreakdown(totals: MacroTotals, goalStr: string): CalorieBreakdown {
  const proteinKcal = Math.max(0, totals.protein) * KCAL_PER_G.protein;
  const fatKcal = Math.max(0, totals.fat) * KCAL_PER_G.fat;
  const netCarbs = Math.max(0, totals.carbs - Math.max(0, totals.fiber));
  const carbsKcal = netCarbs * KCAL_PER_G.carbs;
  const fiberKcal = Math.max(0, totals.fiber) * KCAL_PER_G.fiber;
  const consumed = Math.max(0, totals.calories);
  const macroKcal = proteinKcal + fatKcal + carbsKcal + fiberKcal;
  // Logged calories not explained by macros (alcohol, rounding, cal-only entries).
  const unknownKcal = Math.max(0, consumed - macroKcal);
  const goal = parseGoal(goalStr);
  return {
    proteinKcal,
    fatKcal,
    carbsKcal,
    fiberKcal,
    unknownKcal,
    macroKcal,
    consumed,
    goal,
    remaining: goal !== null ? goal - consumed : null,
  };
}
