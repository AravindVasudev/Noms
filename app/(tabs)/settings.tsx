import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProfileCard from '../../components/ui/profile-card';

export default function Settings() {
  const handleSetGoals = () => {
    console.log('Set Goals pressed');
  };

  const handleClearAppData = () => {
    console.log('Clear App Data pressed');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ProfileCard />
      <View style={styles.section}>
        <Pressable
          style={({ pressed }) => [styles.settingItem, pressed && styles.settingItemPressed]}
          onPress={handleSetGoals}
        >
          <Text style={styles.settingText}>Set Goals</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Pressable
          style={({ pressed }) => [styles.settingItem, pressed && styles.settingItemPressed]}
          onPress={handleClearAppData}
        >
          <Text style={[styles.settingText, styles.destructiveText]}>Clear App Data</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },
  settingItemPressed: {
    backgroundColor: '#f2f2f7',
  },
  settingText: {
    fontSize: 17,
    color: '#000',
  },
  destructiveText: {
    color: '#ff3b30',
  },
  chevron: {
    fontSize: 24,
    color: '#c7c7cc',
    fontWeight: '400',
  },
});
