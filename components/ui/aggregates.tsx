import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '@/hooks/use-app-theme';
import { getCalorieBreakdown } from '../../lib/calorie-breakdown';
import { useAppSelector } from '../../lib/store';
import CalorieDonut, { DonutSegment } from './calorie-donut';

type Totals = {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
};

type Props = {
  totals: Totals;
  onAdd: () => void;
};

const DONUT_SIZE = 148;

function formatGrams(value: number): string {
  const rounded = Math.round(Math.max(0, value) * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function MacroRow({ dot, name, value, colors }: { dot: string; name: string; value: string; colors: { label: string; secondary: string } }) {
  return (
    <View style={styles.macroRow}>
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text style={[styles.macroName, { color: colors.secondary }]}>{name}</Text>
      <Text style={[styles.macroValue, { color: colors.label }]}>{value}</Text>
    </View>
  );
}

export default function Aggregates({ totals, onAdd }: Props) {
  const goals = useAppSelector((state) => state.goals);
  const { colors, scheme } = useAppTheme();
  const breakdown = getCalorieBreakdown(totals, goals.calories);
  const hasGoal = breakdown.goal !== null;
  const isOver = breakdown.remaining !== null && breakdown.remaining < 0;

  const segmentColors = {
    protein: scheme === 'dark' ? '#30D158' : '#34C759',
    fat: scheme === 'dark' ? '#FFD60A' : '#FFCC00',
    carbs: scheme === 'dark' ? '#FF453A' : '#FF3B30',
    fiber: scheme === 'dark' ? '#AC8E68' : '#8B2D26',
    unknown: scheme === 'dark' ? '#636366' : '#A9A9B0',
    goal: colors.systemBlue,
  };

  // Full circle = goal when set and not over; otherwise shares of what was eaten.
  const denominator = hasGoal && !isOver
    ? (breakdown.goal as number)
    : Math.max(breakdown.macroKcal + breakdown.unknownKcal, 1);
  const frac = (kcal: number) => Math.min(Math.max(kcal / denominator, 0), 1);
  const segments: DonutSegment[] = [
    { fraction: frac(breakdown.proteinKcal), color: segmentColors.protein },
    { fraction: frac(breakdown.fatKcal), color: segmentColors.fat },
    { fraction: frac(breakdown.carbsKcal), color: segmentColors.carbs },
    { fraction: frac(breakdown.fiberKcal), color: segmentColors.fiber },
    { fraction: frac(breakdown.unknownKcal), color: segmentColors.unknown },
  ];

  const centerNumber = !hasGoal
    ? String(Math.round(breakdown.consumed))
    : isOver
      ? String(Math.round(-(breakdown.remaining as number)))
      : String(Math.round(breakdown.remaining as number));
  const centerLabel = !hasGoal ? 'Eaten' : isOver ? 'Over' : 'Remaining';

  return (
    <LinearGradient
      colors={scheme === 'dark' ? [colors.cardBackground, colors.cardBackground] : ['#e9f4ff', '#ffffff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.wrap, { borderColor: colors.systemBlue, backgroundColor: colors.cardBackground }]}
    >
      <View style={styles.titleRow}>
        <View>
          <Text style={[styles.title, { color: colors.label }]}>Calories</Text>
          {hasGoal && <Text style={[styles.subtitle, { color: colors.secondaryLabel }]}>Remaining = Goal − Food</Text>}
        </View>
        <TouchableOpacity style={[styles.plus, { backgroundColor: colors.systemBlue }]} onPress={onAdd}>
          <Text style={[styles.plusText, { color: colors.onAccent }]}>+</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        <View style={{ width: DONUT_SIZE, height: DONUT_SIZE }}>
          <CalorieDonut size={DONUT_SIZE} strokeWidth={16} segments={segments} trackColor={scheme === 'dark' ? '#2C2C2E' : '#E9E9EE'} />
          <View style={styles.centerOverlay}>
            <Text style={[styles.centerNumber, { color: colors.label }, isOver && { color: colors.destructive }]} numberOfLines={1}>
              {centerNumber}
            </Text>
            <Text style={[styles.centerLabel, { color: colors.secondaryLabel }, isOver && { color: colors.destructive }]}>{centerLabel}</Text>
          </View>
        </View>
        <View style={styles.table}>
          {hasGoal && (
            <MacroRow dot={segmentColors.goal} name="Base Goal" value={`${Math.round(breakdown.goal as number)} Cal`} colors={{ label: colors.label, secondary: colors.secondaryLabel }} />
          )}
          <MacroRow dot={segmentColors.protein} name="Protein" value={`${formatGrams(totals.protein)} g`} colors={{ label: colors.label, secondary: colors.secondaryLabel }} />
          <MacroRow dot={segmentColors.fat} name="Fat" value={`${formatGrams(totals.fat)} g`} colors={{ label: colors.label, secondary: colors.secondaryLabel }} />
          <MacroRow dot={segmentColors.carbs} name="Carbs" value={`${formatGrams(totals.carbs)} g`} colors={{ label: colors.label, secondary: colors.secondaryLabel }} />
          <MacroRow dot={segmentColors.fiber} name="Fiber" value={`${formatGrams(totals.fiber)} g`} colors={{ label: colors.label, secondary: colors.secondaryLabel }} />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 2,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  centerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerNumber: {
    fontSize: 30,
    fontWeight: '700',
  },
  centerLabel: {
    fontSize: 13,
  },
  table: {
    flex: 1,
    marginLeft: 14,
    gap: 8,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  macroName: {
    flex: 1,
    fontSize: 13,
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  plus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusText: {
    fontSize: 20,
    lineHeight: 22,
    fontWeight: '600',
  },
});
