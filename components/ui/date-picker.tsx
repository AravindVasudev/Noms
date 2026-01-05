import { formatDateKey } from '@/lib/date';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  value: Date;
  onChange: (v: Date) => void;
};

export default function DatePicker({ value, onChange }: Props) {
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => formatDateKey(today), [today]);
  const valueKey = useMemo(() => formatDateKey(value), [value]);
  const canGoNext = useMemo(() => valueKey < todayKey, [valueKey, todayKey]);

  const yesterday = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    return d;
  }, [today]);
  const yesterdayKey = useMemo(() => formatDateKey(yesterday), [yesterday]);

  const labelText = useMemo(() => {
    if (valueKey === todayKey) return 'Today';
    if (valueKey === yesterdayKey) return 'Yesterday';
    return value.toDateString();
  }, [valueKey, todayKey, yesterdayKey, value]);

  const goPrev = () => {
    const d = new Date(value);
    d.setDate(d.getDate() - 1);
    onChange(d);
  };

  const goNext = () => {
    const d = new Date(value);
    d.setDate(d.getDate() + 1);
    const nextKey = formatDateKey(d);
    if (nextKey <= todayKey) onChange(d);
  };

  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={goPrev} style={styles.nav}>
        <Text style={styles.navText}>◀</Text>
      </TouchableOpacity>

      <Text style={styles.label}>{labelText}</Text>

      <TouchableOpacity disabled={!canGoNext} onPress={goNext} style={styles.nav}>
        <Text style={[styles.navText, !canGoNext && styles.navTextDisabled]}>▶</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  nav: {
    padding: 8,
    marginHorizontal: 12,
  },
  navText: {
    fontSize: 18,
    color: '#007AFF',
  },
  navTextDisabled: {
    color: '#a0bce8',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#034ea6',
  },
});
