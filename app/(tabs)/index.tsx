import { useDiary } from '@/app/diary-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
        {/* Date picker */}
        <DatePicker value={selectedDate} onChange={setSelectedDate} />

        <LinearGradient
          colors={['#e9f4ff', '#ffffff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.aggregatesRowWrap}
        >
          <Text style={styles.aggregateTitle}>Aggregate</Text>
          <View style={styles.aggregatesRow}>
            <View style={styles.aggregatesText}>
              <Text style={styles.aggregateLine}>
                <Text style={styles.aggregateLabel}>Cal: </Text>
                <Text style={styles.aggregateValue}>{totals.calories} Cal</Text>
                {'   '}
                <Text style={styles.aggregateLabel}>P: </Text>
                <Text style={styles.aggregateValue}>{totals.protein} g</Text>
              </Text>
              <Text style={styles.aggregateLine}>
                <Text style={styles.aggregateLabel}>F: </Text>
                <Text style={styles.aggregateValue}>{totals.fat} g</Text>
                {'   '}
                <Text style={styles.aggregateLabel}>C: </Text>
                <Text style={styles.aggregateValue}>{totals.carbs} g</Text>
                {'   '}
                <Text style={styles.aggregateLabel}>Fi: </Text>
                <Text style={styles.aggregateValue}>{totals.fiber} g</Text>
              </Text>
            </View>
            <TouchableOpacity style={styles.headerPlus} onPress={() => router.push({ pathname: '/add', params: { date: selectedDate } })}>
              <Text style={styles.headerPlusText}>+</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
        <Text style={styles.journeyTitle}>Journey Entries</Text>

        {/* Diary */}
        <FlatList
          data={filteredDiary}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item, index }) => {
            const name = (item.name || '').trim() || 'Quick Add';
            const calories = typeof item.calories === 'number' ? item.calories.toString() : '-';
            const fat = typeof item.fat === 'number' ? item.fat.toString() : '-';
            const carbs = typeof item.carbs === 'number' ? item.carbs.toString() : '-';
            const protein = typeof item.protein === 'number' ? item.protein.toString() : '-';
            const fiber = typeof item.fiber === 'number' ? item.fiber.toString() : '-';
            return (
              <Swipeable renderRightActions={renderRight(item)}>
                <View style={styles.todoItem}>
                  <Text style={styles.diaryName}>{name}</Text>
                  <Text style={styles.diaryCalories}>{calories} Cal</Text>
                  <Text style={styles.diaryDetails}>
                    (F: {fat}g  C: {carbs}g  P: {protein}g  Fi: {fiber}g)
                  </Text>
                </View>
              </Swipeable>
            );
          }}
        />
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
  aggregatesRowWrap: {
    borderWidth: 3,
    borderColor: '#007AFF',
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
    backgroundColor: 'rgba(0,122,255,0.06)',
    // 3D effect
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 6,
  },
  aggregatesText: {
    flex: 1,
  },
  aggregateLine: {
    fontSize: 14,
    color: '#222',
    fontWeight: '600',
  },
  aggregateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#034ea6',
    marginBottom: 8,
  },
  aggregateLabel: {
    fontWeight: '700',
    color: '#034ea6',
  },
  aggregateValue: {
    fontWeight: '600',
    color: '#022a66',
  },
  headerPlus: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  headerPlusText: {
    color: '#fff',
    fontSize: 24,
    lineHeight: 26,
    fontWeight: '600',
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
