import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProfileCard from '../../components/ui/profile-card';
import SettingsItem from '../../components/ui/settings-item';
import { useAppTheme } from '../../hooks/use-app-theme';
import { AppearancePreference, setAppearanceAsync } from '../../lib/appearanceSlice';
import { useAppDispatch, useAppSelector } from '../../lib/store';
import { setWeightUnitAsync } from '../../lib/trainingSlice';

const APPEARANCE_OPTIONS: { value: AppearancePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function Settings() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const weightUnit = useAppSelector((state) => state.training.weightUnit);
  const appearance = useAppSelector((state) => state.appearance.preference);
  const { colors } = useAppTheme();

  const handleSetGoals = () => {
    router.push('/goals');
  };

  const handleManageData = () => {
    router.push('/manage-data');
  };

  const handleCustomizeInsights = () => {
    router.push('/customize-insights');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.systemGroupedBackground }]}>
      <ProfileCard />

      {/* Settings Menu */}
      <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
        <SettingsItem title="Set Goals" onPress={handleSetGoals} />
      </View>
      <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
        <SettingsItem title="Customize Insights" onPress={handleCustomizeInsights} />
      </View>
      <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.unitRow}>
          <Text style={[styles.unitLabel, { color: colors.label }]}>Appearance</Text>
          <View style={[styles.unitToggle, { backgroundColor: colors.segmentedTrack }]} accessibilityRole="radiogroup">
            {APPEARANCE_OPTIONS.map((option) => {
              const selected = appearance === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => dispatch(setAppearanceAsync(option.value))}
                  style={[styles.unitItem, selected && { backgroundColor: colors.systemBlue }]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Use ${option.label} appearance`}
                >
                  <Text style={[styles.unitText, { color: colors.secondaryLabel }, selected && styles.unitTextSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
      <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.unitRow}>
          <Text style={[styles.unitLabel, { color: colors.label }]}>Weight Unit</Text>
          <View style={[styles.unitToggle, { backgroundColor: colors.segmentedTrack }]} accessibilityRole="radiogroup">
            {(['kg', 'lb'] as const).map((option) => {
              const selected = weightUnit === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => dispatch(setWeightUnitAsync(option))}
                  style={[styles.unitItem, selected && { backgroundColor: colors.systemBlue }]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Use ${option}`}
                >
                  <Text style={[styles.unitText, { color: colors.secondaryLabel }, selected && styles.unitTextSelected]}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
      <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
        <SettingsItem title="Manage Data" onPress={handleManageData} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  unitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  unitLabel: {
    fontSize: 17,
  },
  unitToggle: {
    flexDirection: 'row',
    borderRadius: 999,
    padding: 3,
    gap: 2,
  },
  unitItem: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  unitText: {
    fontSize: 14,
    fontWeight: '600',
  },
  unitTextSelected: {
    color: '#fff',
  },
});
