import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useAppTheme } from '@/hooks/use-app-theme';

interface LineChartCardProps {
  title: string;
  labels: string[];
  dataPoints: number[];
  goal?: number;
  yAxisSuffix?: string;
  width?: number;
  height?: number;
  scrollable?: boolean;
  decimalPlaces?: number;
  fromZero?: boolean;
}

export function LineChartCard({ title, labels, dataPoints, goal, yAxisSuffix = '', width, height = 220, scrollable = false, decimalPlaces = 0, fromZero = true }: LineChartCardProps) {
  const { colors, scheme } = useAppTheme();
  const screenWidth = Dimensions.get('window').width - 32;
  const chartWidth = scrollable ? Math.max(screenWidth, labels.length * 60) : (width ?? screenWidth);

  const datasets = [{ data: dataPoints }];
  if (goal !== undefined) {
    const goalColor = scheme === 'dark' ? '#FF453A' : '#FF3B30';
    datasets.push({
      data: Array(labels.length).fill(goal),
      color: (opacity = 1) => goalColor,
      strokeDasharray: [5, 5],
    } as any);
  }

  const chartComponent = (
    <LineChart
      data={{ labels: labels, datasets: datasets }}
      width={chartWidth}
      height={height}
      yAxisSuffix={yAxisSuffix}
      yAxisInterval={1}
      chartConfig={{
        backgroundColor: colors.cardBackground,
        backgroundGradientFrom: colors.cardBackground,
        backgroundGradientTo: colors.cardBackground,
        decimalPlaces,
        color: (opacity = 1) => colors.systemBlue,
        labelColor: (opacity = 1) => (scheme === 'dark' ? `rgba(235,235,245,${0.6 * opacity})` : `rgba(60,60,67,${0.6 * opacity})`),
        style: { borderRadius: 8 },
        propsForDots: { r: '4', strokeWidth: '2', stroke: colors.systemBlue },
      }}
      bezier
      style={{ borderRadius: 8 }}
      fromZero={fromZero}
    />
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.label }]}>{title}</Text>
      <View style={[styles.chartWrapper, { backgroundColor: colors.cardBackground }]}>
        {scrollable ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {chartComponent}
          </ScrollView>
        ) : (
          chartComponent
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  title: { fontSize: 18, fontWeight: '600' },
  chartWrapper: { padding: 8, borderRadius: 8 },
});

export default LineChartCard;
