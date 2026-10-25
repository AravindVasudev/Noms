import { formatDateKey, getLastNDaysKeys, keyToWeekdayLabel } from '@/lib/date';
import { useBodyMass } from '@/hooks/use-body-mass';
import { convertWeightFromKg, formatWeight, roundWeight } from '@/lib/weight';
import { useRouter } from 'expo-router';
import React, { Fragment, useMemo, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DurationPicker from '../../components/ui/duration-picker';
import AverageCard from '../../components/ui/average-card';
import LineChartCard from '../../components/ui/line-chart-card';
import { Nutrition } from '../../lib/diarySlice';
import { InsightMetricId } from '../../lib/insightsSettingsSlice';
import { useAppSelector } from '../../lib/store';

type MetricConfig = {
  id: Exclude<InsightMetricId, 'weight'>;
  field: keyof Nutrition;
  title: string;
  yAxisSuffix: string;
  unit: string;
  goalKey: 'calories' | 'protein' | 'fiber' | 'fat' | 'carbs';
  overIsGood: boolean;
};

const METRIC_CONFIGS: Record<Exclude<InsightMetricId, 'weight'>, MetricConfig> = {
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
    () => insightsSettings.order
      .filter((id): id is Exclude<InsightMetricId, 'weight'> => id !== 'weight' && insightsSettings.visible[id])
      .map((id) => METRIC_CONFIGS[id]),
    [insightsSettings],
  );

  // All enabled metrics (nutrition + weight) in user order. Weight is
  // rendered inline at its position; it has no diary field or goal.
  const orderedIds = useMemo(
    () => insightsSettings.order.filter((id) => insightsSettings.visible[id]),
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

  const bodyMass = useBodyMass();

  const showWeight = insightsSettings.visible.weight && bodyMass.status === 'ready' && bodyMass.latestKg !== null;

  // Weight history for the selected duration, in the preferred unit.
  // Only actual weigh-in days are plotted — no forward-fill, so gaps
  // between sparse weigh-ins stay honest. The x-axis is therefore not
  // uniformly spaced in time.
  const weightHistory = useMemo(() => {
    if (bodyMass.status !== 'ready') return null;
    const entries: { label: string; value: number }[] = [];
    dayKeys.forEach((key, index) => {
      const kg = bodyMass.byDayKg[key];
      if (kg != null) entries.push({ label: labels[index], value: roundWeight(convertWeightFromKg(kg, bodyMass.unit)) });
    });
    if (entries.length === 0) return null;
    const values = entries.map((e) => e.value);
    const stats = entries.length < 2 ? null : {
      change: roundWeight(values[values.length - 1] - values[0]),
      low: Math.min(...values),
      high: Math.max(...values),
    };
    return {
      labels: entries.map((e) => e.label),
      points: values,
      stats,
    };
  }, [bodyMass, dayKeys, labels]);

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

    const result: Record<Exclude<InsightMetricId, 'weight'>, number[]> = {
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

    const result: Record<Exclude<InsightMetricId, 'weight'>, (number | null)[]> = {
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
        {orderedIds.map((id) => {
          if (id === 'weight') {
            if (!showWeight) return null;
            return (
              <Fragment key="weight">
                <View style={styles.weightHeader}>
                  <View>
                    <Text style={styles.weightTitle}>Weight</Text>
                    <Text style={styles.weightValue}>
                      {formatWeight(bodyMass.latestKg as number, bodyMass.unit)}
                      <Text style={styles.weightUnit}> {bodyMass.unit}</Text>
                    </Text>
                    {bodyMass.latestDate && (
                      <Text style={styles.weightDate}>
                        {bodyMass.latestDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </Text>
                    )}
                    {weightHistory?.stats && (
                      <>
                        <Text style={styles.weightChange}>
                          {weightHistory.stats.change > 0 ? '+' : ''}{weightHistory.stats.change} {bodyMass.unit} over last {selectedDurationLabel.toLowerCase()}
                        </Text>
                        <Text style={styles.weightDate}>
                          Low {weightHistory.stats.low} · High {weightHistory.stats.high} {bodyMass.unit}
                        </Text>
                      </>
                    )}
                  </View>
                  <View style={styles.unitToggle}>
                    {(['kg', 'lb'] as const).map((option) => {
                      const selected = bodyMass.unit === option;
                      return (
                        <Pressable
                          key={option}
                          onPress={() => bodyMass.setUnit(option)}
                          style={[styles.unitItem, selected && styles.unitItemSelected]}
                        >
                          <Text style={[styles.unitText, selected && styles.unitTextSelected]}>{option}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
                {weightHistory !== null && (
                  <LineChartCard
                    key={`weight-${duration}-${bodyMass.unit}`}
                    title={`Last ${selectedDurationLabel} — Weight`}
                    labels={weightHistory.labels}
                    dataPoints={weightHistory.points}
                    yAxisSuffix={` ${bodyMass.unit}`}
                    width={screenWidth}
                    scrollable={duration > 7}
                    decimalPlaces={1}
                    fromZero={false}
                  />
                )}
              </Fragment>
            );
          }
          const metric = METRIC_CONFIGS[id];
          return (
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
          );
        })}
        {visibleMetrics.length === 0 && !showWeight && (
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
        )}
        {visibleMetrics.length > 0 && (
          <>
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
  weightHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weightTitle: { fontSize: 20, fontWeight: '700', color: '#000' },
  weightValue: { fontSize: 32, fontWeight: '700', color: '#000', marginTop: 2 },
  weightUnit: { fontSize: 18, fontWeight: '500', color: '#636366' },
  weightDate: { fontSize: 14, color: '#636366', marginTop: 2 },
  weightChange: { fontSize: 14, fontWeight: '600', color: '#000', marginTop: 4 },
  unitToggle: { flexDirection: 'row', backgroundColor: '#f2f4f7', borderRadius: 999, padding: 4, gap: 4 },
  unitItem: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999 },
  unitItemSelected: { backgroundColor: '#2296f3' },
  unitText: { fontSize: 14, fontWeight: '500', color: '#344054' },
  unitTextSelected: { color: '#ffffff' },
});
