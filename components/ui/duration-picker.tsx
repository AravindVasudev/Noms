import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

export type DurationOption = { label: string; value: number };

interface DurationPickerProps {
  label?: string;
  value: number;
  options: DurationOption[];
  onChange: (value: number) => void;
  style?: StyleProp<ViewStyle>;
}

export function DurationPicker({ label = 'Duration:', value, options, onChange, style }: DurationPickerProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.durationLabel}>{label}</Text>
      <View style={styles.navbar}>
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={[styles.navItem, selected && styles.navItemSelected]}
            >
              <Text style={[styles.navText, selected && styles.navTextSelected]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  durationLabel: { fontSize: 14, fontWeight: '500' },
  navbar: {
    flexDirection: 'row',
    backgroundColor: '#f2f4f7',
    borderRadius: 999,
    padding: 4,
    gap: 4,
  },
  navItem: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  navItemSelected: {
    backgroundColor: '#2296f3',
  },
  navText: { fontSize: 14, fontWeight: '500', color: '#344054' },
  navTextSelected: { color: '#ffffff' },
});

export default DurationPicker;
