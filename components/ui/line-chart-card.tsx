import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

interface LineChartCardProps {
  title: string;
  labels: string[];
  dataPoints: number[];
  goal?: number;
  yAxisSuffix?: string;
  width?: number;
  height?: number;
  scrollable?: boolean;
}

export function LineChartCard({ title, labels, dataPoints, goal, yAxisSuffix = '', width, height = 220, scrollable = false }: LineChartCardProps) {
  const screenWidth = Dimensions.get('window').width - 32;
  const chartWidth = scrollable ? Math.max(screenWidth, labels.length * 60) : (width ?? screenWidth);

  const datasets = [{ data: dataPoints }];
  if (goal !== undefined) {
    datasets.push({
      data: Array(labels.length).fill(goal),
      color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`,
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
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartWrapper}>
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
  chartWrapper: { backgroundColor: '#fff', padding: 8, borderRadius: 8 },
});

export default LineChartCard;
