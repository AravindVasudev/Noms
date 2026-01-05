import { useDiary } from '@/app/diary-context';
import JourneyEntries from '@/components/ui/journey-entries';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Aggregates from '../../components/ui/aggregates';
import DatePicker from '../../components/ui/date-picker';


export default function HomeScreen() {
  const router = useRouter();
  const { diary, removeEntry } = useDiary();
  const insets = useSafeAreaInsets();
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

  const renderRight = (item: any) => {
    return () => (
      <RectButton
        style={styles.rightAction}
        onPress={() => {
          const idx = diary.findIndex((d) => d === item);
          if (idx !== -1) removeEntry(idx);
        }}
      >
        <Text style={styles.actionText}>✕</Text>
      </RectButton>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <DatePicker value={selectedDate} onChange={setSelectedDate} />
        <Aggregates totals={totals} onAdd={() => router.push({ pathname: '/add', params: { date: selectedDate } })} />
        <Text style={styles.journeyTitle}>Journey Entries</Text>
        <JourneyEntries diary={diary} selectedDate={selectedDate} removeEntry={removeEntry} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    padding: 16,
  },
  todoItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  /* Floating Action Button */
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  fabText: {
    color: '#fff',
    fontSize: 32,
    lineHeight: 36,
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    maxHeight: '80%',
  },
  modalContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: '#222',
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  diaryName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  diaryCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  diaryDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  rightAction: {
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  actionText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  aggregatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  aggregatesText: {
    flex: 1,
  },
  journeyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0a3d9a',
    marginBottom: 8,
    marginTop: 6,
  },

  dateNavTextDisabled: {
    color: '#a0bce8',
  },
});
