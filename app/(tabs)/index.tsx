import JournalEntries from '@/components/ui/journal-entries';
import { formatDateKey } from '@/lib/date';
import { useAppSelector } from '@/lib/store';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Aggregates from '../../components/ui/aggregates';
import DatePicker from '../../components/ui/date-picker';


export default function Diary() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const diary = useAppSelector(state => state.diary.diary);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const filteredDiary = useMemo(() => {
    const selectedKey = formatDateKey(selectedDate);
    return diary.filter((d) => formatDateKey(d.date) === selectedKey);
  }, [diary, selectedDate]);

  const totals = filteredDiary.reduce(
    (acc, cur) => {
      const qty = cur.quantity ?? 1.0;
      acc.calories += (typeof cur.calories === 'number' ? cur.calories : 0) * qty;
      acc.protein += (typeof cur.protein === 'number' ? cur.protein : 0) * qty;
      acc.fat += (typeof cur.fat === 'number' ? cur.fat : 0) * qty;
      acc.carbs += (typeof cur.carbs === 'number' ? cur.carbs : 0) * qty;
      acc.fiber += (typeof cur.fiber === 'number' ? cur.fiber : 0) * qty;
      return acc;
    },
    { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 }
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.systemBackground }]}>
        <DatePicker value={selectedDate} onChange={setSelectedDate} />
        <Aggregates totals={totals} onAdd={() => router.push({ pathname: '/search', params: { date: selectedDate.toISOString() } })} />
        {filteredDiary.length === 0 ? (
          <Pressable
            style={styles.emptyContainer}
            onPress={() => router.push({ pathname: '/search', params: { date: selectedDate.toISOString() } })}
            accessibilityRole="button"
          >
            <Text style={[styles.emptyText, { color: colors.secondaryLabel }]}>No food logged. Click here to add.</Text>
          </Pressable>
        ) : (
          <JournalEntries selectedDate={selectedDate} />
        )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});
