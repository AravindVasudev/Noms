import { formatDateKey, getLastNDaysKeys, keyToWeekdayLabel } from '@/lib/date';
import { useBodyMass } from '@/hooks/use-body-mass';
import { useAppTheme } from '@/hooks/use-app-theme';
import { convertWeightFromKg, formatWeight, roundWeight } from '@/lib/weight';
import { KG_TO_LB, WeightUnit } from '@/lib/weight';
import { useRouter } from 'expo-router';
import React, { Fragment, useMemo, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DurationPicker from '../../components/ui/duration-picker';
import AverageCard from '../../components/ui/average-card';
import LineChartCard from '../../components/ui/line-chart-card';
import { Nutrition } from '../../lib/diarySlice';
import { InsightMetricId } from '../../lib/insightsSettingsSlice';
import { formatExerciseRef } from '../../lib/workout-store';
import { useAppSelector } from '../../lib/store';

type NutritionMetricId = Exclude<InsightMetricId, 'weight' | 'trainingVolume' | 'trainingTopSet'>;

type MetricConfig = {
  id: NutritionMetricId;
  field: keyof Nutrition;
  title: string;
  yAxisSuffix: string;
  unit: string;
  goalKey: 'calories' | 'protein' | 'fiber' | 'fat' | 'carbs';
  overIsGood: boolean;
};

const METRIC_CONFIGS: Record<NutritionMetricId, MetricConfig> = {
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
  const [trainingRefKey, setTrainingRefKey] = useState<string | null>(null);
  const diary = useAppSelector(state => state.diary.diary);
  const goalsStrings = useAppSelector(state => state.goals);
  const insightsSettings = useAppSelector(state => state.insightsSettings);
  const { colors } = useAppTheme();

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
      .filter((id): id is NutritionMetricId => id !== 'weight' && id !== 'trainingVolume' && id !== 'trainingTopSet' && insightsSettings.visible[id])
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

    const result: Record<NutritionMetricId, number[]> = {
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

    const result: Record<NutritionMetricId, (number | null)[]> = {
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

  // --- Training charts (completed workouts only; active workout excluded) ---
  const training = useAppSelector((state) => state.training);
  const trainingExerciseById = useMemo(
    () => new Map(training.exercises.map((e) => [e.id, e])),
    [training.exercises]
  );
  const completedTrainingSets = useMemo(() => {
    const ids = new Set(training.workouts.map((w) => w.id));
    return training.sets.filter((s) => ids.has(s.workoutId) && s.completed && (s.reps != null || s.weight != null));
  }, [training.workouts, training.sets]);

  const refKeyOf = (exerciseId: number, variation: string | null): string =>
    `${exerciseId}::${variation ?? ''}`;

  const refLabelOf = (exerciseId: number, variation: string | null): string =>
    formatExerciseRef(trainingExerciseById.get(exerciseId)?.name ?? 'Unknown', variation);

  const chartableTrainingRefs = useMemo(() => {
    const seen = new Map<string, { exerciseId: number; variation: string | null; last: number }>();
    const startedById = new Map(training.workouts.map((w) => [w.id, w.startedAt.getTime()]));
    for (const s of completedTrainingSets) {
      const t = startedById.get(s.workoutId) ?? 0;
      const key = refKeyOf(s.exerciseId, s.variation ?? null);
      const prev = seen.get(key);
      if (prev === undefined || t > prev.last) seen.set(key, { exerciseId: s.exerciseId, variation: s.variation ?? null, last: t });
    }
    return [...seen.entries()]
      .sort((a, b) => b[1].last - a[1].last)
      .map(([key, v]) => ({ key, ...v }));
  }, [completedTrainingSets, training.workouts]);

  const selectedTrainingRef = trainingRefKey != null
    ? (chartableTrainingRefs.find((r) => r.key === trainingRefKey) ?? chartableTrainingRefs[0] ?? null)
    : (chartableTrainingRefs[0] ?? null);

  const trainingSeries = useMemo(() => {
    const convert = (weight: number, from: WeightUnit): number =>
      from === training.weightUnit ? weight : from === 'kg' ? weight * KG_TO_LB : weight / KG_TO_LB;
    const volume = new Map<string, number>();
    const maxWeight = new Map<string, number>();
    if (selectedTrainingRef != null) {
      const startedById = new Map(training.workouts.map((w) => [w.id, w.startedAt]));
      for (const s of completedTrainingSets) {
        if (s.exerciseId !== selectedTrainingRef.exerciseId) continue;
        if ((s.variation ?? null) !== (selectedTrainingRef.variation ?? null)) continue;
        const started = startedById.get(s.workoutId);
        if (!started) continue;
        const key = formatDateKey(started);
        if (s.reps != null && s.weight != null) {
          const wConv = convert(s.weight, s.unit);
          volume.set(key, (volume.get(key) ?? 0) + s.reps * wConv);
          maxWeight.set(key, Math.max(maxWeight.get(key) ?? 0, wConv));
        }
      }
    }
    const round1 = (n: number) => Math.round(n * 10) / 10;
    return {
      volume: dayKeys.map((k) => round1(volume.get(k) ?? 0)),
      maxWeight: dayKeys.map((k) => round1(maxWeight.get(k) ?? 0)),
    };
  }, [completedTrainingSets, training.workouts, selectedTrainingRef, dayKeys, training.weightUnit]);

  const showTrainingVolume = insightsSettings.visible.trainingVolume;
  const showTrainingTopSet = insightsSettings.visible.trainingTopSet;
  const showTrainingBlock =
    (showTrainingVolume || showTrainingTopSet) && chartableTrainingRefs.length > 0;
  const trainingBlockIndex = orderedIds.findIndex(
    (id) => (id === 'trainingVolume' || id === 'trainingTopSet') && insightsSettings.visible[id]
  );

  const trainingBlock = !showTrainingBlock ? null : (
    <Fragment>
      <View>
        <Text style={[styles.weightTitle, { color: colors.label }]}>Training</Text>
        <Text style={[styles.weightValue, { color: colors.label }]}>
          {selectedTrainingRef ? refLabelOf(selectedTrainingRef.exerciseId, selectedTrainingRef.variation) : ''}
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.trainingChips}>
          {chartableTrainingRefs.map((r) => (
            <Pressable
              key={r.key}
              onPress={() => setTrainingRefKey(r.key)}
              style={[styles.trainingChip, { backgroundColor: colors.inputBackground }, r.key === selectedTrainingRef?.key && { backgroundColor: colors.systemBlue }]}
            >
              <Text
                style={[styles.trainingChipText, { color: colors.secondaryLabel }, r.key === selectedTrainingRef?.key && { color: colors.onAccent }]}
              >
                {refLabelOf(r.exerciseId, r.variation)}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      {showTrainingVolume && (
        <LineChartCard
          title={`Last ${selectedDurationLabel} — Volume`}
          labels={labels}
          dataPoints={trainingSeries.volume}
          yAxisSuffix={` ${training.weightUnit}`}
          width={screenWidth}
          scrollable={duration > 7}
          decimalPlaces={1}
        />
      )}
      {showTrainingTopSet && (
        <LineChartCard
          title={`Last ${selectedDurationLabel} — Top Set`}
          labels={labels}
          dataPoints={trainingSeries.maxWeight}
          yAxisSuffix={` ${training.weightUnit}`}
          width={screenWidth}
          scrollable={duration > 7}
          decimalPlaces={1}
        />
      )}
    </Fragment>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.systemGroupedBackground }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <DurationPicker
          label="Duration:"
          value={duration}
          options={durationOptions}
          onChange={setDuration}
          style={{ marginBottom: 12, zIndex: 10 }}
        />
        {orderedIds.map((id, index) => {
          if (id === 'trainingVolume' || id === 'trainingTopSet') {
            if (index !== trainingBlockIndex) return null;
            return <Fragment key="training">{trainingBlock}</Fragment>;
          }
          if (id === 'weight') {
            if (!showWeight) return null;
            return (
              <Fragment key="weight">
                <View>
                  <View>
                    <Text style={[styles.weightTitle, { color: colors.label }]}>Weight</Text>
                    <Text style={[styles.weightValue, { color: colors.label }]}>
                      {formatWeight(bodyMass.latestKg as number, bodyMass.unit)}
                      <Text style={[styles.weightUnit, { color: colors.secondaryLabel }]}> {bodyMass.unit}</Text>
                    </Text>
                    {bodyMass.latestDate && (
                      <Text style={[styles.weightDate, { color: colors.secondaryLabel }]}>
                        {bodyMass.latestDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </Text>
                    )}
                    {weightHistory?.stats && (
                      <>
                        <Text style={[styles.weightChange, { color: colors.label }]}>
                          {weightHistory.stats.change > 0 ? '+' : ''}{weightHistory.stats.change} {bodyMass.unit} over last {selectedDurationLabel.toLowerCase()}
                        </Text>
                        <Text style={[styles.weightDate, { color: colors.secondaryLabel }]}>
                          Low {weightHistory.stats.low} · High {weightHistory.stats.high} {bodyMass.unit}
                        </Text>
                      </>
                    )}
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
        {visibleMetrics.length === 0 && !showWeight && !showTrainingBlock && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: colors.label }]}>No graphs enabled</Text>
            <Text style={[styles.emptySubtitle, { color: colors.secondaryLabel }]}>Enable the graphs you want to see in Insights.</Text>
            <Pressable
              onPress={() => router.push('/customize-insights')}
              style={({ pressed }) => [styles.emptyButton, { backgroundColor: colors.systemBlue }, pressed && styles.emptyButtonPressed]}
            >
              <Text style={[styles.emptyButtonText, { color: colors.onAccent }]}>Customize Insights</Text>
            </Pressable>
          </View>
        )}
        {visibleMetrics.length > 0 && (
          <>
            <View style={styles.averagesHeader}>
              <Text style={[styles.averagesTitle, { color: colors.label }]}>Period Averages</Text>
              <Text style={[styles.averagesSubtitle, { color: colors.secondaryLabel }]}>Daily average over logged days · excludes today</Text>
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
  container: { flex: 1, padding: 16 },
  scrollContent: { gap: 16, paddingBottom: 24 },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptySubtitle: { fontSize: 14, textAlign: 'center' },
  emptyButton: { marginTop: 12, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20 },
  emptyButtonPressed: { opacity: 0.85 },
  emptyButtonText: { fontSize: 16, fontWeight: '600' },
  averagesHeader: { marginTop: 8, gap: 2 },
  averagesTitle: { fontSize: 20, fontWeight: '700' },
  averagesSubtitle: { fontSize: 14 },
  weightTitle: { fontSize: 20, fontWeight: '700' },
  weightValue: { fontSize: 32, fontWeight: '700', marginTop: 2 },
  weightUnit: { fontSize: 18, fontWeight: '500' },
  weightDate: { fontSize: 14, marginTop: 2 },
  weightChange: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  trainingChips: { flexDirection: 'row', gap: 8 },
  trainingChip: { borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  trainingChipText: { fontSize: 14, fontWeight: '500' },
});
