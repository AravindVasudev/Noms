import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type AverageRow = {
  periodLabel: string;
  average: number | null;
  goal: number;
};

interface AverageCardProps {
  title: string;
  unit: string;
  rows: AverageRow[];
  /** When true, being over goal is good (green); otherwise over goal is bad (red). */
  overIsGood?: boolean;
  /** Optional TDEE upper/lower bound. When set, uses the same three-state
   * logic as the diary date-picker: green at/ beyond goal, yellow between
   * goal and TDEE, red beyond TDEE. */
  tdee?: number;
}

function formatDelta(delta: number) {
  const rounded = Math.round(delta * 100) / 100;
  return `${rounded > 0 ? '+' : ''}${rounded}`;
}

const GREEN = '#34c759';
const YELLOW = '#FFCC00';
const RED = '#ff3b30';
const GREY = '#636366';

function getDeltaColor(average: number, goal: number, tdee: number | undefined, overIsGood: boolean): string {
  if (tdee === undefined || tdee <= 0 || tdee === goal) {
    const over = average > goal;
    return over === overIsGood ? GREEN : RED;
  }
  if (goal < tdee) {
    if (average <= goal) return GREEN;
    if (average <= tdee) return YELLOW;
    return RED;
  }
  if (average >= goal) return GREEN;
  if (average >= tdee) return YELLOW;
  return RED;
}

export function AverageCard({ title, unit, rows, overIsGood = false, tdee }: AverageCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {rows.map((row) => {
        const hasData = row.average !== null;
        const hasGoal = hasData && row.goal > 0;
        const delta = hasGoal ? (row.average as number) - row.goal : 0;
        const deltaColor = !hasGoal ? GREY : getDeltaColor(row.average as number, row.goal, tdee, overIsGood);
        return (
          <View key={row.periodLabel} style={styles.row}>
            <Text style={styles.period}>{row.periodLabel}</Text>
            {hasData ? (
              <View style={styles.values}>
                <Text style={styles.average}>
                  {row.average}
                  <Text style={styles.unit}> {unit}</Text>
                </Text>
                {hasGoal ? (
                  <Text style={[styles.delta, { color: deltaColor }]}>
                    {formatDelta(delta)} · goal {row.goal}
                  </Text>
                ) : null}
              </View>
            ) : (
              <Text style={styles.noData}>No data</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  title: { fontSize: 18, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f2f2f7',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  period: { fontSize: 15, fontWeight: '500', color: '#000' },
  values: { alignItems: 'flex-end', gap: 2 },
  average: { fontSize: 17, fontWeight: '600', color: '#000' },
  unit: { fontSize: 13, fontWeight: '400', color: '#636366' },
  delta: { fontSize: 13, fontWeight: '500' },
  noData: { fontSize: 14, color: '#8e8e93' },
});

export default AverageCard;
