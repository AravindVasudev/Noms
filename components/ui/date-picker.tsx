import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  value: string; // ISO YYYY-MM-DD
  onChange: (v: string) => void;
};

export default function DatePicker({ value, onChange }: Props) {
  // Parse an ISO YYYY-MM-DD into a local Date at midnight
  const isoToLocalDate = (iso: string) => {
    const [y, m, d] = iso.split('-').map((s) => parseInt(s, 10));
    return new Date(y, m - 1, d);
  };

  // Format a local Date into ISO YYYY-MM-DD
  const localDateToISO = (dt: Date) => {
    const y = dt.getFullYear();
    const m = (dt.getMonth() + 1).toString().padStart(2, '0');
    const d = dt.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const todayISO = useMemo(() => localDateToISO(new Date()), []);
  const canGoNext = useMemo(() => value < todayISO, [value, todayISO]);

  const goPrev = () => {
    const d = isoToLocalDate(value);
    d.setDate(d.getDate() - 1);
    onChange(localDateToISO(d));
  };

  const goNext = () => {
    const d = isoToLocalDate(value);
    d.setDate(d.getDate() + 1);
    const nextISO = localDateToISO(d);
    if (nextISO <= todayISO) onChange(nextISO);
  };

  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={goPrev} style={styles.nav}>
        <Text style={styles.navText}>◀</Text>
      </TouchableOpacity>

      <Text style={styles.label}>{isoToLocalDate(value).toDateString()}</Text>

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
