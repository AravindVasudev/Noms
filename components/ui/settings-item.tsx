import { useAppTheme } from '@/hooks/use-app-theme';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

interface SettingsItemProps {
  title: string;
  onPress: () => void;
  destructive?: boolean;
}

export default function SettingsItem({ title, onPress, destructive = false }: SettingsItemProps) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.settingItem,
        { backgroundColor: pressed ? colors.systemGroupedBackground : colors.cardBackground },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.settingText, { color: destructive ? colors.destructive : colors.label }]}>{title}</Text>
      <Text style={[styles.chevron, { color: colors.separator }]}>›</Text>
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
  },
  settingText: {
    fontSize: 17,
  },
  chevron: {
    fontSize: 24,
    fontWeight: '400',
  },
});
