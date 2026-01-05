import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

interface SettingsItemProps {
  title: string;
  onPress: () => void;
  destructive?: boolean;
}

export default function SettingsItem({ title, onPress, destructive = false }: SettingsItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.settingItem, pressed && styles.settingItemPressed]}
      onPress={onPress}
    >
      <Text style={[styles.settingText, destructive && styles.destructiveText]}>{title}</Text>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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