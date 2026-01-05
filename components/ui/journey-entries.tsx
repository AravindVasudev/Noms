import { Nutrition } from '@/app/diary-context';
import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';

type Props = {
  diary: Nutrition[];
  selectedDate: string;
  removeEntry: (index: number) => void;
};

export default function JourneyEntries({ diary, selectedDate, removeEntry }: Props) {
  const entries = useMemo(() => diary.filter((d) => d.date === selectedDate), [diary, selectedDate]);

  const renderRight = (item: Nutrition) => {
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
  },
  calories: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  details: {
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
});
