import { formatDateKey, getLastNDaysKeys, keyToWeekdayLabel } from '@/lib/date';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Nutrition, useDiary } from '../../components/diary-context';
import DurationPicker from '../../components/ui/duration-picker';
import LineChartCard from '../../components/ui/line-chart-card';

export default function Insights() {
  const [labels, setLabels] = useState<string[]>([]);
  const [caloriesData, setCaloriesData] = useState<number[]>([]);
  const [proteinData, setProteinData] = useState<number[]>([]);
  const [fiberData, setFiberData] = useState<number[]>([]);
  const [fatsData, setFatsData] = useState<number[]>([]);
  const [carbsData, setCarbsData] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState<number>(7);
  const { diary } = useDiary();

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

  useEffect(() => {
    const dayKeys = getLastNDaysKeys(duration);

    const aggregateField = (field: keyof Nutrition) =>
      dayKeys.map((key) =>
        diary.reduce((sum, r: Nutrition) => {
          const rKey = formatDateKey(r.date);
          if (rKey !== key) return sum;
          const val = r[field];
          return sum + (val == null ? 0 : Number(val) || 0);
        }, 0),
      );

    const calories = aggregateField('calories');
    const protein = aggregateField('protein');
    const fiber = aggregateField('fiber');
    const fats = aggregateField('fat');
    const carbs = aggregateField('carbs');

    const prettyLabels = dayKeys.map((k) => keyToWeekdayLabel(k));

    setLabels(prettyLabels);
    setCaloriesData(calories.map((n) => Math.round(n * 100) / 100));
    setProteinData(protein.map((n) => Math.round(n * 100) / 100));
    setFiberData(fiber.map((n) => Math.round(n * 100) / 100));
    setFatsData(fats.map((n) => Math.round(n * 100) / 100));
    setCarbsData(carbs.map((n) => Math.round(n * 100) / 100));
    setLoading(false);
  }, [diary, duration]);

  const screenWidth = Dimensions.get('window').width - 32;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="small" />
      </SafeAreaView>
    );
  }

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
        <LineChartCard
          title={`Last ${selectedDurationLabel} — Calories`}
          labels={labels}
          dataPoints={caloriesData}
          width={screenWidth}
        />
        <LineChartCard
          title={`Last ${selectedDurationLabel} — Protein`}
          labels={labels}
          dataPoints={proteinData}
          width={screenWidth}
        />
        <LineChartCard
          title={`Last ${selectedDurationLabel} — Fiber`}
          labels={labels}
          dataPoints={fiberData}
          width={screenWidth}
        />
        <LineChartCard
          title={`Last ${selectedDurationLabel} — Fats`}
          labels={labels}
          dataPoints={fatsData}
          width={screenWidth}
        />
        <LineChartCard
          title={`Last ${selectedDurationLabel} — Carbs`}
          labels={labels}
          dataPoints={carbsData}
          width={screenWidth}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  scrollContent: { gap: 16, paddingBottom: 24 },
});
