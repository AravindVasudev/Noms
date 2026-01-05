import { useDiary } from '@/components/diary-context';
import JourneyEntries from '@/components/ui/journey-entries';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Aggregates from '../../components/ui/aggregates';
import DatePicker from '../../components/ui/date-picker';


export default function HomeScreen() {
  const router = useRouter();
  const { diary, removeEntry } = useDiary();
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const filteredDiary = useMemo(() => diary.filter((d) => d.date === selectedDate), [diary, selectedDate]);

  const totals = filteredDiary.reduce(
    (acc, cur) => {
      acc.calories += typeof cur.calories === 'number' ? cur.calories : 0;
      acc.protein += typeof cur.protein === 'number' ? cur.protein : 0;
      acc.fat += typeof cur.fat === 'number' ? cur.fat : 0;
      acc.carbs += typeof cur.carbs === 'number' ? cur.carbs : 0;
      acc.fiber += typeof cur.fiber === 'number' ? cur.fiber : 0;
      return acc;
    },
    { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 }
  );

  return (
    <SafeAreaView style={styles.safeArea}>
        <DatePicker value={selectedDate} onChange={setSelectedDate} />
        <Aggregates totals={totals} onAdd={() => router.push({ pathname: '/add', params: { date: selectedDate } })} />
        <JourneyEntries diary={diary} selectedDate={selectedDate} removeEntry={removeEntry} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
});
