import { formatDateKey } from '@/lib/date';
import { Nutrition, removeEntryAsync } from '@/lib/diarySlice';
import { formatQuantity } from '@/lib/quantity';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { useAppTheme } from '@/hooks/use-app-theme';
import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';

type Props = {
  selectedDate: Date;
};

export default function JournalEntries({ selectedDate }: Props) {
  const diary = useAppSelector(state => state.diary.diary);
  const dispatch = useAppDispatch();
  const { colors } = useAppTheme();
  const entries = useMemo(() => {
    const selectedKey = formatDateKey(selectedDate);
    return diary.filter((d) => formatDateKey(d.date) === selectedKey);
  }, [diary, selectedDate]);

  const renderRight = (item: Nutrition) => {
    const Component = () => (
      <RectButton
        style={[styles.rightAction, { backgroundColor: colors.destructive }]}
        onPress={() => {
          if (item && item.id != null) {
            dispatch(removeEntryAsync(item.id));
          }
        }}
      >
        <Text style={[styles.actionText, { color: colors.onAccent }]}>✕</Text>
      </RectButton>
    );
    Component.displayName = 'RightAction';
    return Component;
  };

  return (
    <>
      <Text style={[styles.journalTitle, { color: colors.label }]}>Journal Entries</Text>
      <FlatList
        data={entries}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => {
          const name = (item.name || '').trim() || 'Quick Add';
          const qty = item.quantity ?? 1.0;
          const scaled = (v: number | null) => v == null ? '-' : String(Math.round(v * qty * 100) / 100);
          const calories = scaled(item.calories);
          const fat = scaled(item.fat);
          const carbs = scaled(item.carbs);
          const protein = scaled(item.protein);
          const fiber = scaled(item.fiber);
          return (
            <Swipeable renderRightActions={renderRight(item)}>
              <View style={[styles.item, { borderBottomColor: colors.separator, backgroundColor: colors.systemBackground }]}>
                <Text style={[styles.name, { color: colors.systemBlue }]}>{name} × {formatQuantity(qty)}</Text>
                <Text style={[styles.calories, { color: colors.systemBlue }]}>{calories} Cal</Text>
                <Text style={[styles.details, { color: colors.systemBlue }]}>
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
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  calories: {
    fontSize: 14,
    fontWeight: '600',
  },
  details: {
    fontSize: 12,
    marginTop: 4,
  },
  rightAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  actionText: {
    fontSize: 20,
    fontWeight: '700',
  },
  journalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 6,
  },
});
