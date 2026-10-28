import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProfileCard from '../../components/ui/profile-card';
import SettingsItem from '../../components/ui/settings-item';
import { useAppDispatch, useAppSelector } from '../../lib/store';
import { setWeightUnitAsync } from '../../lib/trainingSlice';

export default function Settings() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const weightUnit = useAppSelector((state) => state.training.weightUnit);

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
    <SafeAreaView style={styles.container}>
      <ProfileCard />

      {/* Settings Menu */}
      <View style={styles.section}>
        <SettingsItem title="Set Goals" onPress={handleSetGoals} />
      </View>
      <View style={styles.section}>
        <SettingsItem title="Customize Insights" onPress={handleCustomizeInsights} />
      </View>
      <View style={styles.section}>
        <View style={styles.unitRow}>
          <Text style={styles.unitLabel}>Weight Unit</Text>
          <View style={styles.unitToggle}>
            {(['kg', 'lb'] as const).map((option) => {
              const selected = weightUnit === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => dispatch(setWeightUnitAsync(option))}
                  style={[styles.unitItem, selected && styles.unitItemSelected]}
                  accessibilityRole="button"
                  accessibilityLabel={`Use ${option}`}
                >
                  <Text style={[styles.unitText, selected && styles.unitTextSelected]}>{option}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
      <View style={styles.section}>
        <SettingsItem title="Manage Data" onPress={handleManageData} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
  section: {
    backgroundColor: '#ffffff',
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
    color: '#000',
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f3',
    borderRadius: 999,
    padding: 3,
    gap: 2,
  },
  unitItem: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  unitItemSelected: {
    backgroundColor: '#007AFF',
  },
  unitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#636366',
  },
  unitTextSelected: {
    color: '#fff',
  },
});
