import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProfileCard from '../../components/ui/profile-card';
import SettingsItem from '../../components/ui/settings-item';
import { clearAllAsync as clearCatalog } from '../../lib/catalogSlice';
import { clearAllAsync as clearDiary } from '../../lib/diarySlice';
import { clearAllAsync as clearGoals } from '../../lib/goalsSlice';
import { clearAllAsync as clearProfile } from '../../lib/profileSlice';
import { useAppDispatch } from '../../lib/store';

export default function Settings() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const handleSetGoals = () => {
    router.push('/goals');
  };

  const handleClearAppData = () => {
    Alert.alert(
      'Clear App Data',
      'This operation is unrevertable. Do you want to proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            // Clear all slices.
            await dispatch(clearDiary());
            await dispatch(clearCatalog());
            await dispatch(clearGoals());
            await dispatch(clearProfile());

            Alert.alert('Data Cleared', 'All app data has been cleared.');
            router.replace('/signup');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ProfileCard />

      {/* Settings Menu */}
      <View style={styles.section}>
        <SettingsItem title="Set Goals" onPress={handleSetGoals} />
      </View>
      <View style={styles.section}>
        <SettingsItem title="Clear App Data" onPress={handleClearAppData} destructive />
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
});
