import { formatDateKey, getLastNDaysKeys, keyToWeekdayLabel } from '@/lib/date';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const [goals, setGoals] = useState({ calories: 0, protein: 0, fiber: 0, fat: 0, carbs: 0 });
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
    const loadGoals = async () => {
      const calories = parseFloat(await AsyncStorage.getItem('goal-calories') || '0');
      const protein = parseFloat(await AsyncStorage.getItem('goal-protein') || '0');
      const fiber = parseFloat(await AsyncStorage.getItem('goal-fiber') || '0');
      const fat = parseFloat(await AsyncStorage.getItem('goal-fat') || '0');
      const carbs = parseFloat(await AsyncStorage.getItem('goal-carbs') || '0');
      setGoals({ calories, protein, fiber, fat, carbs });
    };
    loadGoals();
  }, []);

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
          goal={goals.calories > 0 ? goals.calories : undefined}
          yAxisSuffix=" kcal"
          width={screenWidth}
        />
        <LineChartCard
          title={`Last ${selectedDurationLabel} — Protein`}
          labels={labels}
          dataPoints={proteinData}
          goal={goals.protein > 0 ? goals.protein : undefined}
          yAxisSuffix=" g"
          width={screenWidth}
        />
        <LineChartCard
          title={`Last ${selectedDurationLabel} — Fiber`}
          labels={labels}
          dataPoints={fiberData}
          goal={goals.fiber > 0 ? goals.fiber : undefined}
          yAxisSuffix=" g"
          width={screenWidth}
        />
        <LineChartCard
          title={`Last ${selectedDurationLabel} — Fats`}
          labels={labels}
          dataPoints={fatsData}
          goal={goals.fat > 0 ? goals.fat : undefined}
          yAxisSuffix=" g"
          width={screenWidth}
        />
        <LineChartCard
          title={`Last ${selectedDurationLabel} — Carbs`}
          labels={labels}
          dataPoints={carbsData}
          goal={goals.carbs > 0 ? goals.carbs : undefined}
          yAxisSuffix=" g"
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
