import { CatalogRow } from '@/lib/catalog-store';
import { removeCatalogItemAsync } from '@/lib/catalogSlice';
import { addEntryAsync } from '@/lib/diarySlice';
import BarcodeIcon from '@/components/ui/barcode-icon';
import { useAppDispatch } from '@/lib/store';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';

type Props = {
  items: CatalogRow[];
  date?: Date;
};

export default function CatalogEntries({ items, date }: Props) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleItemPress = (item: CatalogRow) => {
    const entryDate = date || new Date();
    dispatch(addEntryAsync({ 
      name: item.name, 
      calories: item.calories, 
      fat: item.fat, 
      protein: item.protein, 
      carbs: item.carbs, 
      fiber: item.fiber, 
      date: entryDate 
    }));
    router.back();
  };

  const renderRight = (item: CatalogRow) => {
    const Component = () => (
      <RectButton
        style={styles.rightAction}
        onPress={() => {
          if (item && item.id != null) {
            dispatch(removeCatalogItemAsync(item.id));
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
    <FlatList
      data={items}
      keyExtractor={(_, index) => index.toString()}
      renderItem={({ item }) => {
        const name = (item.name || '').trim() || 'Quick Add';
        const calories = typeof item.calories === 'number' ? item.calories.toString() : '-';
        const fat = typeof item.fat === 'number' ? item.fat.toString() : '-';
        const carbs = typeof item.carbs === 'number' ? item.carbs.toString() : '-';
        const protein = typeof item.protein === 'number' ? item.protein.toString() : '-';
        const fiber = typeof item.fiber === 'number' ? item.fiber.toString() : '-';

        const content = (
          <TouchableOpacity onPress={() => handleItemPress(item)}>
            <View style={styles.item}>
              <View style={styles.itemContent}>
                <View style={styles.itemText}>
                  <Text style={styles.name}>{name}</Text>
                  <Text style={styles.calories}>{calories} Cal</Text>
                  <Text style={styles.details}>
                    (F: {fat}g  C: {carbs}g  P: {protein}g  Fi: {fiber}g)
                  </Text>
                </View>
                {item.barcode && (
                  <View style={styles.barcodeContainer}>
                    <BarcodeIcon size={20} tintColor="#034ea6" />
                  </View>
                )}
                {Platform.OS === 'web' && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => {
                      if (item.id != null) {
                        Alert.alert('Delete Item', `Delete "${name}"?`, [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: () => dispatch(removeCatalogItemAsync(item.id)),
                          },
                        ]);
                      }
                    }}
                  >
                    <Text style={styles.deleteButtonText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableOpacity>
        );

        if (Platform.OS === 'web') {
          return content;
        }

        return (
          <Swipeable renderRightActions={renderRight(item)}>
            {content}
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
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemText: {
    flex: 1,
  },
  barcodeContainer: {
    marginLeft: 8,
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
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ff3b30',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
