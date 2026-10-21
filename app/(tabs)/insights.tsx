import { formatDateKey, getLastNDaysKeys, keyToWeekdayLabel } from '@/lib/date';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DurationPicker from '../../components/ui/duration-picker';
import AverageCard from '../../components/ui/average-card';
import LineChartCard from '../../components/ui/line-chart-card';
import { Nutrition } from '../../lib/diarySlice';
import { InsightMetricId } from '../../lib/insightsSettingsSlice';
import { useAppSelector } from '../../lib/store';

type MetricConfig = {
  id: InsightMetricId;
  field: keyof Nutrition;
  title: string;
  yAxisSuffix: string;
  unit: string;
  goalKey: 'calories' | 'protein' | 'fiber' | 'fat' | 'carbs';
  overIsGood: boolean;
};

const METRIC_CONFIGS: Record<InsightMetricId, MetricConfig> = {
  calories: { id: 'calories', field: 'calories', title: 'Calories', yAxisSuffix: ' kcal', unit: 'kcal', goalKey: 'calories', overIsGood: false },
  protein: { id: 'protein', field: 'protein', title: 'Protein', yAxisSuffix: ' g', unit: 'g', goalKey: 'protein', overIsGood: true },
  fiber: { id: 'fiber', field: 'fiber', title: 'Fiber', yAxisSuffix: ' g', unit: 'g', goalKey: 'fiber', overIsGood: true },
  fat: { id: 'fat', field: 'fat', title: 'Fats', yAxisSuffix: ' g', unit: 'g', goalKey: 'fat', overIsGood: false },
  carbs: { id: 'carbs', field: 'carbs', title: 'Carbs', yAxisSuffix: ' g', unit: 'g', goalKey: 'carbs', overIsGood: false },
};

// Fixed aggregate windows, independent of the Duration picker.
const AVERAGE_WINDOWS = [
  { periodLabel: 'Week', days: 7 },
  { periodLabel: 'Fortnight', days: 14 },
  { periodLabel: 'Month', days: 30 },
];

export default function Insights() {
  const router = useRouter();
  const [duration, setDuration] = useState<number>(7);
  const diary = useAppSelector(state => state.diary.diary);
  const goalsStrings = useAppSelector(state => state.goals);
  const insightsSettings = useAppSelector(state => state.insightsSettings);

  const goals = useMemo(() => ({
    calories: parseFloat(goalsStrings.calories) || 0,
    protein: parseFloat(goalsStrings.protein) || 0,
    fiber: parseFloat(goalsStrings.fiber) || 0,
    fat: parseFloat(goalsStrings.fat) || 0,
    carbs: parseFloat(goalsStrings.carbs) || 0,
    tdee: parseFloat(goalsStrings.tdee) || 0,
  }), [goalsStrings]);

  const visibleMetrics = useMemo(
    () => insightsSettings.order.filter((id) => insightsSettings.visible[id]).map((id) => METRIC_CONFIGS[id]),
    [insightsSettings],
  );

  const durationOptions = useMemo(
    () =>
      [
        { label: 'Week', value: 7 },
        { label: 'Fortnight', value: 14 },
        { label: 'Month', value: 30 },
      ] satisfies { label: string; value: number }[],
    [],
  );

  const selectedDurationLabel = useMemo(
    () => durationOptions.find((item) => item.value === duration)?.label ?? 'Week',
    [duration, durationOptions],
  );

  const dayKeys = useMemo(() => getLastNDaysKeys(duration), [duration]);

  const labels = useMemo(() => dayKeys.map((k) => keyToWeekdayLabel(k)), [dayKeys]);

  const series = useMemo(() => {
    const aggregateField = (field: keyof Nutrition) =>
      dayKeys.map((key) =>
        diary.reduce((sum, r: Nutrition) => {
          const rKey = formatDateKey(r.date);
          if (rKey !== key) return sum;
          const val = r[field];
          if (typeof val !== 'number') return sum;
          return sum + (Number(val) || 0) * (r.quantity ?? 1.0);
        }, 0),
      );

    const round = (n: number) => Math.round(n * 100) / 100;

    const result: Record<InsightMetricId, number[]> = {
      calories: [],
      protein: [],
      fiber: [],
      fat: [],
      carbs: [],
    };
    for (const metric of visibleMetrics) {
      result[metric.id] = aggregateField(metric.field).map(round);
    }
    return result;
  }, [dayKeys, diary, visibleMetrics]);

  // Period averages: daily mean over logged days for fixed Week/Fortnight/Month
  // windows. Independent of the Duration picker. Excludes today since the
  // current day may still be unfinished.
  const averages = useMemo(() => {
    const round = (n: number) => Math.round(n * 100) / 100;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const result: Record<InsightMetricId, (number | null)[]> = {
      calories: [],
      protein: [],
      fiber: [],
      fat: [],
      carbs: [],
    };
    for (const metric of visibleMetrics) {
      result[metric.id] = AVERAGE_WINDOWS.map(({ days }) => {
        const keys = getLastNDaysKeys(days, yesterday);
        let total = 0;
        let loggedDays = 0;
        for (const key of keys) {
          let hasEntry = false;
          for (const r of diary) {
            if (formatDateKey(r.date) !== key) continue;
            hasEntry = true;
            const val = r[metric.field];
            if (typeof val !== 'number') continue;
            total += (Number(val) || 0) * (r.quantity ?? 1.0);
          }
          if (hasEntry) loggedDays += 1;
        }
        return loggedDays === 0 ? null : round(total / loggedDays);
      });
    }
    return result;
  }, [diary, visibleMetrics]);

  const screenWidth = Dimensions.get('window').width - 32;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <DurationPicker
          label="Duration:"
          value={duration}
          options={durationOptions}
          onChange={setDuration}
          style={{ marginBottom: 12, zIndex: 10 }}
        />
        {visibleMetrics.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No graphs enabled</Text>
            <Text style={styles.emptySubtitle}>Enable the graphs you want to see in Insights.</Text>
            <Pressable
              onPress={() => router.push('/customize-insights')}
              style={({ pressed }) => [styles.emptyButton, pressed && styles.emptyButtonPressed]}
            >
              <Text style={styles.emptyButtonText}>Customize Insights</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {visibleMetrics.map((metric) => (
              <LineChartCard
                key={metric.id}
                title={`Last ${selectedDurationLabel} — ${metric.title}`}
                labels={labels}
                dataPoints={series[metric.id]}
                goal={goals[metric.goalKey] > 0 ? goals[metric.goalKey] : undefined}
                yAxisSuffix={metric.yAxisSuffix}
                width={screenWidth}
                scrollable={duration > 7}
              />
            ))}
            <View style={styles.averagesHeader}>
              <Text style={styles.averagesTitle}>Period Averages</Text>
              <Text style={styles.averagesSubtitle}>Daily average over logged days · excludes today</Text>
            </View>
            {visibleMetrics.map((metric) => (
              <AverageCard
                key={`avg-${metric.id}`}
                title={`${metric.title} Average`}
                unit={metric.unit}
                overIsGood={metric.overIsGood}
                tdee={metric.id === 'calories' ? goals.tdee : undefined}
                rows={AVERAGE_WINDOWS.map((window, index) => ({
                  periodLabel: window.periodLabel,
                  average: averages[metric.id][index] ?? null,
                  goal: goals[metric.goalKey],
                }))}
              />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  scrollContent: { gap: 16, paddingBottom: 24 },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#000' },
  emptySubtitle: { fontSize: 14, color: '#636366', textAlign: 'center' },
  emptyButton: { marginTop: 12, backgroundColor: '#007AFF', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20 },
  emptyButtonPressed: { opacity: 0.85 },
  emptyButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  averagesHeader: { marginTop: 8, gap: 2 },
  averagesTitle: { fontSize: 20, fontWeight: '700', color: '#000' },
  averagesSubtitle: { fontSize: 14, color: '#636366' },
});
