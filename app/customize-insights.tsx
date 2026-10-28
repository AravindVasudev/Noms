import { useAppTheme } from '@/hooks/use-app-theme';
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
  trainingVolume: 'Training Volume',
  trainingTopSet: 'Training Top Set',
};

export default function CustomizeInsightsScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { colors } = useAppTheme();
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.systemGroupedBackground }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.label }]}>Customize Insights</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryLabel }]}>Choose which graphs appear in Insights and the order they show in.</Text>

        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          {settings.order.map((id, index) => {
            const isFirst = index === 0;
            const isLast = index === settings.order.length - 1;
            return (
              <View key={id} style={[styles.row, index < settings.order.length - 1 && styles.rowBorder, index < settings.order.length - 1 && { borderBottomColor: colors.separator }]}>
                <View style={styles.labelWrap}>
                  <Text style={[styles.label, { color: colors.label }]}>{METRIC_LABELS[id]}</Text>
                </View>
                <View style={styles.controls}>
                  <Pressable
                    accessibilityLabel={`Move ${METRIC_LABELS[id]} up`}
                    disabled={isFirst}
                    onPress={() => handleMove(index, -1)}
                    style={({ pressed }) => [styles.arrowButton, { backgroundColor: colors.inputBackground }, isFirst && styles.arrowDisabled, pressed && !isFirst && styles.arrowPressed]}
                  >
                    <Text style={[styles.arrowText, { color: colors.systemBlue }, isFirst && [styles.arrowTextDisabled, { color: colors.separator }]]}>↑</Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel={`Move ${METRIC_LABELS[id]} down`}
                    disabled={isLast}
                    onPress={() => handleMove(index, 1)}
                    style={({ pressed }) => [styles.arrowButton, { backgroundColor: colors.inputBackground }, isLast && styles.arrowDisabled, pressed && !isLast && styles.arrowPressed]}
                  >
                    <Text style={[styles.arrowText, { color: colors.systemBlue }, isLast && [styles.arrowTextDisabled, { color: colors.separator }]]}>↓</Text>
                  </Pressable>
                  <Switch value={settings.visible[id]} onValueChange={(value) => handleToggle(id, value)} />
                </View>
              </View>
            );
          })}
        </View>

        <Pressable onPress={handleReset} style={({ pressed }) => [styles.resetButton, { backgroundColor: colors.cardBackground }, pressed && styles.resetPressed]}>
          <Text style={[styles.resetText, { color: colors.systemBlue }]}>Reset to defaults</Text>
        </Pressable>

        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.doneButton, { backgroundColor: colors.systemBlue }, pressed && styles.donePressed]}>
          <Text style={[styles.doneText, { color: colors.onAccent }]}>Done</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  section: {
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
  },
  labelWrap: {
    flex: 1,
  },
  label: {
    fontSize: 17,
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
  },
  arrowPressed: {
    opacity: 0.7,
  },
  arrowDisabled: {
    opacity: 0.4,
  },
  arrowText: {
    fontSize: 16,
    fontWeight: '600',
  },
  arrowTextDisabled: {
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  resetPressed: {
    opacity: 0.7,
  },
  resetText: {
    fontSize: 16,
    fontWeight: '600',
  },
  doneButton: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  donePressed: {
    opacity: 0.85,
  },
  doneText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
