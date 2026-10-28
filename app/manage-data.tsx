import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SettingsItem from '../components/ui/settings-item';
import { useAppTheme } from '@/hooks/use-app-theme';
import { clearAllAsync as clearAppearance, setAppearance } from '../lib/appearanceSlice';
import { clearAllAsync as clearCatalog, setCatalog } from '../lib/catalogSlice';
import { clearAllAsync as clearDiary, setDiary } from '../lib/diarySlice';
import { clearAllAsync as clearGoals, setGoalsAsync } from '../lib/goalsSlice';
import { clearAllAsync as clearInsightsSettings, setInsightsSettings } from '../lib/insightsSettingsSlice';
import { clearAllAsync as clearProfile, setProfile } from '../lib/profileSlice';
import { clearTrainingAsync, setTrainingData } from '../lib/trainingSlice';
import { useAppDispatch, useAppSelector } from '../lib/store';

export default function ManageData() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.profile);
  const goals = useAppSelector((state) => state.goals);
  const catalog = useAppSelector((state) => state.catalog);
  const diary = useAppSelector((state) => state.diary);
  const insightsSettings = useAppSelector((state) => state.insightsSettings);
  const training = useAppSelector((state) => state.training);
  const appearance = useAppSelector((state) => state.appearance);
  const { colors } = useAppTheme();

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Export all app data?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              // Create JSON object with all app data
              const exportData = {
                profile,
                goals,
                catalog,
                diary,
                insightsSettings,
                appearance,
                training: {
                  exercises: training.exercises,
                  workouts: training.workouts,
                  sets: training.sets,
                },
                exportDate: new Date().toISOString(),
              };

              // Convert to JSON string
              const jsonString = JSON.stringify(exportData, null, 2);

              // Create temporary file
              const file = new FileSystem.File(FileSystem.Paths.cache, 'noms-export.json');
              await file.create({ overwrite: true });
              file.write(jsonString);

              // Share the file (iOS will show save/share options)
              await Sharing.shareAsync(file.uri, {
                mimeType: 'application/json',
                dialogTitle: 'Export App Data',
                UTI: 'public.json',
              });
            } catch (error) {
              Alert.alert('Export Failed', 'An error occurred while exporting data.');
              console.error('Export error:', error);
            }
          },
        },
      ]
    );
  };

  const handleImportData = async () => {
    try {
      // Open document picker for JSON files
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      // Read the file content
      const file = new FileSystem.File(result.assets[0].uri);
      const fileContent = await file.text();
      const importedData = JSON.parse(fileContent);

      // Validate the imported data structure
      if (
        !('profile' in importedData) ||
        !('goals' in importedData) ||
        !('catalog' in importedData) ||
        !('diary' in importedData)
      ) {
        Alert.alert('Invalid File', 'Invalid file type');
        return;
      }

      // Confirm before importing
      Alert.alert(
        'Import Data',
        'This will replace all current app data. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import',
            onPress: async () => {
              await dispatch(setProfile(importedData.profile));
              await dispatch(setGoalsAsync({ tdee: '', ...importedData.goals }));
              await dispatch(setCatalog(importedData.catalog));
              await dispatch(setDiary(importedData.diary));
              if ('insightsSettings' in importedData) {
                await dispatch(setInsightsSettings(importedData.insightsSettings));
              }
              if ('appearance' in importedData) {
                await dispatch(setAppearance(importedData.appearance));
              }
              if ('training' in importedData && importedData.training) {
                await dispatch(
                  setTrainingData({
                    exercises: importedData.training.exercises ?? [],
                    workouts: importedData.training.workouts ?? [],
                    sets: importedData.training.sets ?? [],
                  })
                );
              }

              Alert.alert('Success', 'Data imported successfully!');
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Import Failed', 'Invalid file type');
      console.error('Import error:', error);
    }
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
            await dispatch(clearInsightsSettings());
            await dispatch(clearTrainingAsync());
            await dispatch(clearAppearance());

            Alert.alert('Data Cleared', 'All app data has been cleared.');
            router.replace('/signup');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.systemGroupedBackground }]}>
      <Text style={[styles.title, { color: colors.label }]}>Manage Data</Text>

      {/* Data Management Options */}
      <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
        <SettingsItem title="Import App Data" onPress={handleImportData} />
      </View>
      <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
        <SettingsItem title="Export App Data" onPress={handleExportData} />
      </View>
      <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
        <SettingsItem title="Clear App Data" onPress={handleClearAppData} destructive />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
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
});
