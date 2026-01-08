import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SettingsItem from '../components/ui/settings-item';
import { clearAllAsync as clearCatalog } from '../lib/catalogSlice';
import { clearAllAsync as clearDiary } from '../lib/diarySlice';
import { clearAllAsync as clearGoals } from '../lib/goalsSlice';
import { clearAllAsync as clearProfile } from '../lib/profileSlice';
import { useAppDispatch } from '../lib/store';

export default function ManageData() {
  const router = useRouter();
  const dispatch = useAppDispatch();

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
      <Text style={styles.title}>Manage Data</Text>

      {/* Data Management Options */}
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
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: '#034ea6',
    textAlign: 'center',
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
});
