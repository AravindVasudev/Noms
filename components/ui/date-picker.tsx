import { formatDateKey, getStartOfWeek } from '@/lib/date';
import { useAppSelector } from '@/lib/store';
import React, { useCallback, useMemo } from 'react';
import { PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  value: Date;
  onChange: (v: Date) => void;
};

const WEEKDAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const EMPTY_GREY = '#E9E9EE';
const DONE_GREEN = '#D1EFB5';
const DONE_RED = '#DD7373';
const DONE_NEUTRAL = '#007AFF';
const SELECT_RING = '#007AFF';

export default function DatePicker({ value, onChange }: Props) {
  const diary = useAppSelector((state) => state.diary.diary);
  const goals = useAppSelector((state) => state.goals);

  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => formatDateKey(today), [today]);
  const valueKey = useMemo(() => formatDateKey(value), [value]);

  const weekStart = useMemo(() => getStartOfWeek(value), [value]);
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      days.push(d);
    }
    return days;
  }, [weekStart]);

  const canGoNextWeek = useMemo(() => {
    const nextMonday = new Date(weekStart);
    nextMonday.setDate(weekStart.getDate() + 7);
    return formatDateKey(nextMonday) <= todayKey;
  }, [weekStart, todayKey]);

  const goal = useMemo(() => {
    const n = parseFloat(goals.calories);
    return goals.calories && !isNaN(n) && n > 0 ? n : null;
  }, [goals.calories]);

  const statsByKey = useMemo(() => {
    const map = new Map<string, { count: number; calories: number }>();
    for (const entry of diary) {
      const key = formatDateKey(entry.date);
      const qty = entry.quantity ?? 1.0;
      const cal = (typeof entry.calories === 'number' ? entry.calories : 0) * qty;
      const prev = map.get(key) ?? { count: 0, calories: 0 };
      prev.count += 1;
      prev.calories += cal;
      map.set(key, prev);
    }
    return map;
  }, [diary]);

  const goPrevWeek = useCallback(() => {
    const d = new Date(value);
    d.setDate(d.getDate() - 7);
    onChange(d);
  }, [value, onChange]);

  const goNextWeek = useCallback(() => {
    const d = new Date(value);
    d.setDate(d.getDate() + 7);
    if (formatDateKey(d) <= todayKey) {
      onChange(d);
    } else {
      // Clamp to today when the same weekday overflows into the future.
      onChange(new Date(today));
    }
  }, [value, todayKey, today, onChange]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderRelease: (_, gestureState) => {
          const SWIPE_THRESHOLD = 50;

          if (gestureState.dx > SWIPE_THRESHOLD) {
            goPrevWeek();
          } else if (gestureState.dx < -SWIPE_THRESHOLD && canGoNextWeek) {
            goNextWeek();
          }
        },
      }),
    [goPrevWeek, goNextWeek, canGoNextWeek]
  );

  const weekLabel = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 6);
    const sameMonth = weekStart.getMonth() === end.getMonth();
    const monthFmt: Intl.DateTimeFormatOptions = { month: 'short' };
    const startMonth = weekStart.toLocaleDateString(undefined, monthFmt);
    if (sameMonth) return `${startMonth} ${weekStart.getDate()}–${end.getDate()}`;
    const endMonth = end.toLocaleDateString(undefined, monthFmt);
    return `${startMonth} ${weekStart.getDate()} – ${endMonth} ${end.getDate()}`;
  }, [weekStart]);

  return (
    <View style={styles.wrap}>
      <View style={styles.weekRow}>
        <TouchableOpacity onPress={goPrevWeek} style={styles.nav} accessibilityRole="button" accessibilityLabel="Previous week">
          <Text style={styles.navText}>◀</Text>
        </TouchableOpacity>

        <View {...panResponder.panHandlers} style={styles.strip}>
          {weekDays.map((day, i) => {
            const key = formatDateKey(day);
            const isSelected = key === valueKey;
            const isFuture = key > todayKey;
            const isToday = key === todayKey;
            const stats = statsByKey.get(key);
            const logged = !!stats && stats.count > 0;
            const over = goal !== null && (stats?.calories ?? 0) > goal;
            const fill = !logged ? EMPTY_GREY : goal === null ? DONE_NEUTRAL : over ? DONE_RED : DONE_GREEN;
            // Past logged days render as full fills; today renders in-progress
            // (grey ring + filled center) since the day isn't over yet.
            const variant = !logged || isFuture ? 'empty' : isToday ? 'partial' : 'done';

            return (
              <TouchableOpacity
                key={key}
                disabled={isFuture}
                onPress={() => onChange(day)}
                style={[styles.day, isFuture && styles.dayDisabled]}
                accessibilityRole="button"
                accessibilityLabel={day.toDateString()}
                accessibilityState={{ selected: isSelected, disabled: isFuture }}
              >
                <View style={[styles.circle, isSelected && styles.circleSelected]}>
                  <View
                    style={[
                      styles.circleInner,
                      variant === 'empty' && { backgroundColor: EMPTY_GREY },
                      variant === 'done' && { backgroundColor: fill },
                      variant === 'partial' && { backgroundColor: EMPTY_GREY },
                    ]}
                  >
                    {variant === 'partial' && <View style={[styles.dot, { backgroundColor: fill }]} />}
                  </View>
                </View>
                <Text style={[styles.weekday, isToday && styles.weekdayToday]}>{WEEKDAY_LETTERS[i]}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          disabled={!canGoNextWeek}
          onPress={goNextWeek}
          style={styles.nav}
          accessibilityRole="button"
          accessibilityLabel="Next week"
        >
          <Text style={[styles.navText, !canGoNextWeek && styles.navTextDisabled]}>▶</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.weekLabel}>{weekLabel}</Text>
    </View>
  );
}

const CIRCLE_SIZE = 34;
const DOT_SIZE = 14;

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 10,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nav: {
    padding: 8,
  },
  navText: {
    fontSize: 16,
    color: '#007AFF',
  },
  navTextDisabled: {
    color: '#a0bce8',
  },
  strip: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 4,
  },
  day: {
    alignItems: 'center',
    minWidth: 40,
  },
  dayDisabled: {
    opacity: 0.4,
  },
  circle: {
    width: CIRCLE_SIZE + 4,
    height: CIRCLE_SIZE + 4,
    borderRadius: (CIRCLE_SIZE + 4) / 2,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleSelected: {
    borderColor: SELECT_RING,
  },
  circleInner: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  weekday: {
    marginTop: 4,
    fontSize: 12,
    color: '#8e8e93',
  },
  weekdayToday: {
    fontWeight: '700',
    color: '#034ea6',
  },
  weekLabel: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: '#034ea6',
  },
});
