import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProfileCard from '../../components/ui/profile-card';
import SettingsItem from '../../components/ui/settings-item';

export default function Settings() {
  const router = useRouter();

  const handleSetGoals = () => {
    router.push('/goals');
  };

  const handleManageData = () => {
    router.push('/manage-data');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ProfileCard />

      {/* Settings Menu */}
      <View style={styles.section}>
        <SettingsItem title="Set Goals" onPress={handleSetGoals} />
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
});
