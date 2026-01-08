import { formatDateKey } from '@/lib/date';
import React, { useMemo } from 'react';
import { PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderRelease: (_, gestureState) => {
          const SWIPE_THRESHOLD = 50;

          if (gestureState.dx > SWIPE_THRESHOLD) {
            // Right swipe - go to previous day (left button action)
            goPrev();
          } else if (gestureState.dx < -SWIPE_THRESHOLD) {
            // Left swipe - go to next day (right button action)
            goNext();
          }
        },
      }),
    [value, todayKey]
  );

  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={goPrev} style={styles.nav}>
        <Text style={styles.navText}>◀</Text>
      </TouchableOpacity>

      <View {...panResponder.panHandlers} style={styles.swipeArea}>
        <Text style={styles.label}>{labelText}</Text>
      </View>

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
  swipeArea: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#034ea6',
  },
});
