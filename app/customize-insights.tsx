import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  DEFAULT_INSIGHTS_SETTINGS,
  InsightMetricId,
  setInsightsSettingsAsync,
  setInsightsOrderAsync,
  setMetricVisibleAsync,
} from '../lib/insightsSettingsSlice';
import { useAppDispatch, useAppSelector } from '../lib/store';

const METRIC_LABELS: Record<InsightMetricId, string> = {
  calories: 'Calories',
  protein: 'Protein',
  fiber: 'Fiber',
  fat: 'Fat',
  carbs: 'Carbs',
  weight: 'Weight',
};

export default function CustomizeInsightsScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.insightsSettings);

  const handleToggle = (id: InsightMetricId, value: boolean) => {
    dispatch(setMetricVisibleAsync({ id, visible: value, current: settings }));
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= settings.order.length) return;
    const order = [...settings.order];
    const [moved] = order.splice(index, 1);
    order.splice(nextIndex, 0, moved);
    dispatch(setInsightsOrderAsync({ order, current: settings }));
  };

  const handleReset = () => {
    dispatch(setInsightsSettingsAsync(DEFAULT_INSIGHTS_SETTINGS));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Customize Insights</Text>
        <Text style={styles.subtitle}>Choose which graphs appear in Insights and the order they show in.</Text>

        <View style={styles.section}>
          {settings.order.map((id, index) => {
            const isFirst = index === 0;
            const isLast = index === settings.order.length - 1;
            return (
              <View key={id} style={[styles.row, index < settings.order.length - 1 && styles.rowBorder]}>
                <View style={styles.labelWrap}>
                  <Text style={styles.label}>{METRIC_LABELS[id]}</Text>
                </View>
                <View style={styles.controls}>
                  <Pressable
                    accessibilityLabel={`Move ${METRIC_LABELS[id]} up`}
                    disabled={isFirst}
                    onPress={() => handleMove(index, -1)}
                    style={({ pressed }) => [styles.arrowButton, isFirst && styles.arrowDisabled, pressed && !isFirst && styles.arrowPressed]}
                  >
                    <Text style={[styles.arrowText, isFirst && styles.arrowTextDisabled]}>↑</Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel={`Move ${METRIC_LABELS[id]} down`}
                    disabled={isLast}
                    onPress={() => handleMove(index, 1)}
                    style={({ pressed }) => [styles.arrowButton, isLast && styles.arrowDisabled, pressed && !isLast && styles.arrowPressed]}
                  >
                    <Text style={[styles.arrowText, isLast && styles.arrowTextDisabled]}>↓</Text>
                  </Pressable>
                  <Switch value={settings.visible[id]} onValueChange={(value) => handleToggle(id, value)} />
                </View>
              </View>
            );
          })}
        </View>

        <Pressable onPress={handleReset} style={({ pressed }) => [styles.resetButton, pressed && styles.resetPressed]}>
          <Text style={styles.resetText}>Reset to defaults</Text>
        </Pressable>

        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.doneButton, pressed && styles.donePressed]}>
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
    color: '#034ea6',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#636366',
    textAlign: 'center',
    marginBottom: 16,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5ea',
  },
  labelWrap: {
    flex: 1,
  },
  label: {
    fontSize: 17,
    color: '#000',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  arrowButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#f0f0f3',
  },
  arrowPressed: {
    backgroundColor: '#e5e5ea',
  },
  arrowDisabled: {
    opacity: 0.4,
  },
  arrowText: {
    fontSize: 16,
    color: '#034ea6',
    fontWeight: '600',
  },
  arrowTextDisabled: {
    color: '#c7c7cc',
  },
  resetButton: {
    marginTop: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  resetPressed: {
    backgroundColor: '#e5e5ea',
  },
  resetText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  doneButton: {
    marginTop: 12,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  donePressed: {
    opacity: 0.85,
  },
  doneText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
