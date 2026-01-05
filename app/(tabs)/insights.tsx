import { formatDateKey, getLastNDaysKeys, keyToWeekdayLabel } from '@/lib/date';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Nutrition, useDiary } from '../../components/diary-context';
import DurationPicker from '../../components/ui/duration-picker';
import LineChartCard from '../../components/ui/line-chart-card';

export default function Insights() {
  const [labels, setLabels] = useState<string[]>([]);
  const [dataPoints, setDataPoints] = useState<number[]>([]);
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

    const totals = dayKeys.map((key) => {
      return diary.reduce((sum, r: Nutrition) => {
        const rKey = formatDateKey(r.date);
        const cals = r.calories == null ? 0 : Number(r.calories) || 0;
        return rKey === key ? sum + cals : sum;
      }, 0);
    });

    const prettyLabels = dayKeys.map((k) => keyToWeekdayLabel(k));

    setLabels(prettyLabels);
    setDataPoints(totals.map((n) => Math.round(n * 100) / 100));
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
        dataPoints={dataPoints}
        width={screenWidth}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
});
