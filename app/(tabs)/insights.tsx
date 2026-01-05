import { formatDateKey, getLastNDaysKeys, keyToWeekdayLabel } from '@/lib/date';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Nutrition, useDiary } from '../../components/diary-context';
import DurationPicker from '../../components/ui/duration-picker';

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
      <Text style={styles.title}>Last {selectedDurationLabel} — Calories</Text>
      <View style={styles.chartWrapper}>
        <LineChart
          data={{ labels: labels, datasets: [{ data: dataPoints }] }}
          width={screenWidth}
          height={220}
          yAxisSuffix=" kcal"
          yAxisInterval={1}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(34, 150, 243, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0,0,0, ${opacity})`,
            style: { borderRadius: 8 },
            propsForDots: { r: '4', strokeWidth: '2', stroke: '#22a6f3' },
          }}
          bezier
          style={{ borderRadius: 8 }}
          fromZero
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  chartWrapper: { backgroundColor: '#fff', padding: 8, borderRadius: 8 },
});
