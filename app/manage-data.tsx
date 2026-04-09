import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SettingsItem from '../components/ui/settings-item';
import { clearAllAsync as clearCatalog, setCatalog } from '../lib/catalogSlice';
import { clearAllAsync as clearDiary, setDiary } from '../lib/diarySlice';
import { clearAllAsync as clearGoals, setGoalsAsync } from '../lib/goalsSlice';
import { clearAllAsync as clearProfile, setProfile } from '../lib/profileSlice';
import { useAppDispatch, useAppSelector } from '../lib/store';

export default function ManageData() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.profile);
  const goals = useAppSelector((state) => state.goals);
  const catalog = useAppSelector((state) => state.catalog);
  const diary = useAppSelector((state) => state.diary);

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
              const exportData = {
                profile,
                goals,
                catalog,
                diary,
                exportDate: new Date().toISOString(),
              };

              const jsonString = JSON.stringify(exportData, null, 2);

              if (Platform.OS === 'web') {
                // Web: create Blob and trigger download
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `noms-export-${new Date().toISOString().slice(0, 10)}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              } else {
                // Native: use FileSystem + Sharing
                const file = new FileSystem.File(FileSystem.Paths.cache, 'noms-export.json');
                await file.create({ overwrite: true });
                file.write(jsonString);

                await Sharing.shareAsync(file.uri, {
                  mimeType: 'application/json',
                  dialogTitle: 'Export App Data',
                  UTI: 'public.json',
                });
              }
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
      if (Platform.OS === 'web') {
        // Web: use native file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';

        input.onchange = async (e: Event) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) return;

          const text = await file.text();
          let importedData: any;
          try {
            importedData = JSON.parse(text);
          } catch {
            Alert.alert('Invalid File', 'Invalid file type');
            return;
          }

          if (
            !('profile' in importedData) ||
            !('goals' in importedData) ||
            !('catalog' in importedData) ||
            !('diary' in importedData)
          ) {
            Alert.alert('Invalid File', 'Invalid file type');
            return;
          }

          Alert.alert(
            'Import Data',
            'This will replace all current app data. Continue?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Import',
                onPress: async () => {
                  await dispatch(setProfile(importedData.profile));
                  await dispatch(setGoalsAsync(importedData.goals));
                  await dispatch(setCatalog(importedData.catalog));
                  await dispatch(setDiary(importedData.diary));
                  Alert.alert('Success', 'Data imported successfully!');
                },
              },
            ]
          );
        };

        input.click();
      } else {
        // Native: use expo-document-picker
        const result = await DocumentPicker.getDocumentAsync({
          type: 'application/json',
          copyToCacheDirectory: true,
        });

        if (result.canceled) {
          return;
        }

        const file = new FileSystem.File(result.assets[0].uri);
        const fileContent = await file.text();
        const importedData = JSON.parse(fileContent);

        if (
          !('profile' in importedData) ||
          !('goals' in importedData) ||
          !('catalog' in importedData) ||
          !('diary' in importedData)
        ) {
          Alert.alert('Invalid File', 'Invalid file type');
          return;
        }

        Alert.alert(
          'Import Data',
          'This will replace all current app data. Continue?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Import',
              onPress: async () => {
                await dispatch(setProfile(importedData.profile));
                await dispatch(setGoalsAsync(importedData.goals));
                await dispatch(setCatalog(importedData.catalog));
                await dispatch(setDiary(importedData.diary));

                Alert.alert('Success', 'Data imported successfully!');
              },
            },
          ]
        );
      }
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
        <SettingsItem title="Import App Data" onPress={handleImportData} />
      </View>
      <View style={styles.section}>
        <SettingsItem title="Export App Data" onPress={handleExportData} />
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
