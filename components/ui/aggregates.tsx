import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

const SEGMENT_COLORS = {
  protein: '#34C759',
  fat: '#FFCC00',
  carbs: '#FF3B30',
  fiber: '#8B2D26',
  unknown: '#A9A9B0',
  goal: '#007AFF',
} as const;

const DONUT_SIZE = 148;

function formatGrams(value: number): string {
  const rounded = Math.round(Math.max(0, value) * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function MacroRow({ dot, name, value }: { dot: string; name: string; value: string }) {
  return (
    <View style={styles.macroRow}>
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text style={styles.macroName}>{name}</Text>
      <Text style={styles.macroValue}>{value}</Text>
    </View>
  );
}

export default function Aggregates({ totals, onAdd }: Props) {
  const goals = useAppSelector((state) => state.goals);
  const breakdown = getCalorieBreakdown(totals, goals.calories);
  const hasGoal = breakdown.goal !== null;
  const isOver = breakdown.remaining !== null && breakdown.remaining < 0;

  // Full circle = goal when set and not over; otherwise shares of what was eaten.
  const denominator = hasGoal && !isOver
    ? (breakdown.goal as number)
    : Math.max(breakdown.macroKcal + breakdown.unknownKcal, 1);
  const frac = (kcal: number) => Math.min(Math.max(kcal / denominator, 0), 1);
  const segments: DonutSegment[] = [
    { fraction: frac(breakdown.proteinKcal), color: SEGMENT_COLORS.protein },
    { fraction: frac(breakdown.fatKcal), color: SEGMENT_COLORS.fat },
    { fraction: frac(breakdown.carbsKcal), color: SEGMENT_COLORS.carbs },
    { fraction: frac(breakdown.fiberKcal), color: SEGMENT_COLORS.fiber },
    { fraction: frac(breakdown.unknownKcal), color: SEGMENT_COLORS.unknown },
  ];

  const centerNumber = !hasGoal
    ? String(Math.round(breakdown.consumed))
    : isOver
      ? String(Math.round(-(breakdown.remaining as number)))
      : String(Math.round(breakdown.remaining as number));
  const centerLabel = !hasGoal ? 'Eaten' : isOver ? 'Over' : 'Remaining';

  return (
    <LinearGradient
      colors={['#e9f4ff', '#ffffff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.wrap}
    >
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.title}>Calories</Text>
          {hasGoal && <Text style={styles.subtitle}>Remaining = Goal − Food</Text>}
        </View>
        <TouchableOpacity style={styles.plus} onPress={onAdd}>
          <Text style={styles.plusText}>+</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        <View style={{ width: DONUT_SIZE, height: DONUT_SIZE }}>
          <CalorieDonut size={DONUT_SIZE} strokeWidth={16} segments={segments} />
          <View style={styles.centerOverlay}>
            <Text style={[styles.centerNumber, isOver && styles.over]} numberOfLines={1}>
              {centerNumber}
            </Text>
            <Text style={[styles.centerLabel, isOver && styles.over]}>{centerLabel}</Text>
          </View>
        </View>
        <View style={styles.table}>
          {hasGoal && (
            <MacroRow dot={SEGMENT_COLORS.goal} name="Base Goal" value={`${Math.round(breakdown.goal as number)} Cal`} />
          )}
          <MacroRow dot={SEGMENT_COLORS.protein} name="Protein" value={`${formatGrams(totals.protein)} g`} />
          <MacroRow dot={SEGMENT_COLORS.fat} name="Fat" value={`${formatGrams(totals.fat)} g`} />
          <MacroRow dot={SEGMENT_COLORS.carbs} name="Carbs" value={`${formatGrams(totals.carbs)} g`} />
          <MacroRow dot={SEGMENT_COLORS.fiber} name="Fiber" value={`${formatGrams(totals.fiber)} g`} />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    backgroundColor: 'rgba(0,122,255,0.06)',
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
    color: '#111',
  },
  subtitle: {
    fontSize: 12,
    color: '#8e8e93',
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
    color: '#111',
  },
  centerLabel: {
    fontSize: 13,
    color: '#555',
  },
  over: {
    color: '#ff3b30',
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
    color: '#333',
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
  },
  plus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusText: {
    color: '#fff',
    fontSize: 20,
    lineHeight: 22,
    fontWeight: '600',
  },
});
