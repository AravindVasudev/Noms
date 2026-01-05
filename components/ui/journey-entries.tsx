import { formatDateKey } from '@/lib/date';
import { Nutrition, removeEntryAsync } from '@/lib/diarySlice';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';

type Props = {
  selectedDate: Date;
};

export default function JourneyEntries({ selectedDate }: Props) {
  const diary = useAppSelector(state => state.diary.diary);
  const dispatch = useAppDispatch();
  const entries = useMemo(() => {
    const selectedKey = formatDateKey(selectedDate);
    return diary.filter((d) => formatDateKey(d.date) === selectedKey);
  }, [diary, selectedDate]);

  const renderRight = (item: Nutrition) => {
    const Component = () => (
      <RectButton
        style={styles.rightAction}
        onPress={() => {
          if (item && item.id != null) {
            dispatch(removeEntryAsync(item.id));
          }
        }}
      >
        <Text style={styles.actionText}>✕</Text>
      </RectButton>
    );
    Component.displayName = 'RightAction';
    return Component;
  };

  return (
    <>
      <Text style={styles.journeyTitle}>Journal Entries</Text>
      <FlatList
        data={entries}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => {
          const name = (item.name || '').trim() || 'Quick Add';
          const calories = typeof item.calories === 'number' ? item.calories.toString() : '-';
          const fat = typeof item.fat === 'number' ? item.fat.toString() : '-';
          const carbs = typeof item.carbs === 'number' ? item.carbs.toString() : '-';
          const protein = typeof item.protein === 'number' ? item.protein.toString() : '-';
          const fiber = typeof item.fiber === 'number' ? item.fiber.toString() : '-';
          return (
            <Swipeable renderRightActions={renderRight(item)}>
              <View style={styles.item}>
                <Text style={styles.name}>{name}</Text>
                <Text style={styles.calories}>{calories} Cal</Text>
                <Text style={styles.details}>
                  (F: {fat}g  C: {carbs}g  P: {protein}g  Fi: {fiber}g)
                </Text>
              </View>
            </Swipeable>
          );
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  item: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
    color: '#034ea6',
  },
  calories: {
    fontSize: 14,
    fontWeight: '600',
    color: '#034ea6',
  },
  details: {
    fontSize: 12,
    color: '#034ea6',
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
  journeyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0a3d9a',
    marginBottom: 8,
    marginTop: 6,
  },
});
