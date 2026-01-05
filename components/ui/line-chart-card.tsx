import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

interface LineChartCardProps {
  title: string;
  labels: string[];
  dataPoints: number[];
  width?: number;
  height?: number;
}

export function LineChartCard({ title, labels, dataPoints, width, height = 220 }: LineChartCardProps) {
  const chartWidth = width ?? Dimensions.get('window').width - 32;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartWrapper}>
        <LineChart
          data={{ labels: labels, datasets: [{ data: dataPoints }] }}
          width={chartWidth}
          height={height}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  title: { fontSize: 18, fontWeight: '600' },
  chartWrapper: { backgroundColor: '#fff', padding: 8, borderRadius: 8 },
});

export default LineChartCard;
