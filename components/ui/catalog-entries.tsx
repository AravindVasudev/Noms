import { CatalogRow } from '@/lib/catalog-store';
import { removeCatalogItemAsync } from '@/lib/catalogSlice';
import { addEntryAsync } from '@/lib/diarySlice';
import { DEFAULT_QUANTITY } from '@/lib/quantity';
import { useAppDispatch } from '@/lib/store';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import QuantityModal from './quantity-modal';

type Props = {
  items: CatalogRow[];
  date?: Date;
  showAlphaScroller?: boolean;
};

type ListRow =
  | { kind: 'header'; title: string }
  | { kind: 'item'; item: CatalogRow };

const ALPHABET = ['#', ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))];

// Fixed layout heights so every row offset is known exactly upfront.
// Item rows clamp their texts to a single line so the height never varies.
const SECTION_HEADER_HEIGHT = 24;
const CATALOG_ROW_HEIGHT = 86;

function getSectionKey(name: string): string {
  const trimmed = (name || '').trim().toUpperCase();
  const first = trimmed.charAt(0);
  return first >= 'A' && first <= 'Z' ? first : '#';
}

function buildSections(items: CatalogRow[]): { title: string; data: CatalogRow[] }[] {
  const groups = new Map<string, CatalogRow[]>();
  for (const item of items) {
    const key = getSectionKey(item.name || '');
    const group = groups.get(key);
    if (group) {
      group.push(item);
    } else {
      groups.set(key, [item]);
    }
  }
  return [...groups.entries()]
    .sort(([a], [b]) => {
      if (a === b) return 0;
      if (a === '#') return -1;
      if (b === '#') return 1;
      return a.localeCompare(b);
    })
    .map(([title, data]) => ({ title, data }));
}

export default function CatalogEntries({ items, date, showAlphaScroller = true }: Props) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [pendingItem, setPendingItem] = useState<CatalogRow | null>(null);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const listRef = useRef<FlatList<ListRow>>(null);
  const scrollerHeight = useRef(0);

  const handleItemPress = (item: CatalogRow) => {
    setPendingItem(item);
  };

  const handleQuantityConfirm = (quantity: number) => {
    if (!pendingItem) return;
    const entryDate = date || new Date();
    dispatch(addEntryAsync({
      name: pendingItem.name,
      calories: pendingItem.calories,
      fat: pendingItem.fat,
      protein: pendingItem.protein,
      carbs: pendingItem.carbs,
      fiber: pendingItem.fiber,
      quantity: quantity ?? DEFAULT_QUANTITY,
      date: entryDate
    }));
    setPendingItem(null);
    router.back();
  };

  // Flatten sections into header + item rows with exact precomputed offsets.
  // Fixed heights mean scrollToOffset can jump to any section deterministically —
  // no measurement-dependent scrollToIndex that snaps back to the top.
  const { rows, stickyIndices, flatIndexByLetter, rowOffsets } = useMemo(() => {
    const flatRows: ListRow[] = [];
    const sticky: number[] = [];
    const byLetter = new Map<string, number>();
    for (const section of buildSections(items)) {
      byLetter.set(section.title, flatRows.length);
      sticky.push(flatRows.length);
      flatRows.push({ kind: 'header', title: section.title });
      for (const item of section.data) {
        flatRows.push({ kind: 'item', item });
      }
    }
    const offsets: number[] = new Array(flatRows.length);
    let y = 0;
    for (let i = 0; i < flatRows.length; i++) {
      offsets[i] = y;
      y += flatRows[i].kind === 'header' ? SECTION_HEADER_HEIGHT : CATALOG_ROW_HEIGHT;
    }
    return { rows: flatRows, stickyIndices: sticky, flatIndexByLetter: byLetter, rowOffsets: offsets };
  }, [items]);

  const getRowLayout = (_data: unknown, index: number) => {
    const row = rows[index];
    const length = row != null && row.kind === 'header' ? SECTION_HEADER_HEIGHT : CATALOG_ROW_HEIGHT;
    return { length, offset: rowOffsets[index] ?? 0, index };
  };

  const scrollToRow = (rowIndex: number) => {
    const offset = rowOffsets[rowIndex];
    if (offset == null) return;
    listRef.current?.scrollToOffset({ offset, animated: true });
  };

  // Resolve a tapped alphabet position to the nearest section that exists.
  // Exact letter first, then outward (forward preferred on ties).
  const resolveRow = (tappedAlphabetIndex: number): { letter: string; rowIndex: number } | null => {
    for (let d = 0; d < ALPHABET.length; d++) {
      const fwd = tappedAlphabetIndex + d;
      if (fwd < ALPHABET.length) {
        const rowIndex = flatIndexByLetter.get(ALPHABET[fwd]);
        if (rowIndex != null) return { letter: ALPHABET[fwd], rowIndex };
      }
      if (d > 0) {
        const back = tappedAlphabetIndex - d;
        if (back >= 0) {
          const rowIndex = flatIndexByLetter.get(ALPHABET[back]);
          if (rowIndex != null) return { letter: ALPHABET[back], rowIndex };
        }
      }
    }
    return null;
  };

  const jumpToAlphabetIndex = (tappedAlphabetIndex: number) => {
    const resolved = resolveRow(tappedAlphabetIndex);
    if (!resolved) return;
    setActiveLetter(resolved.letter);
    scrollToRow(resolved.rowIndex);
  };

  const handleScrollerTouch = (locationY: number) => {
    const height = scrollerHeight.current;
    if (height <= 0) return;
    const index = Math.max(0, Math.min(ALPHABET.length - 1, Math.floor((locationY / height) * ALPHABET.length)));
    jumpToAlphabetIndex(index);
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

  const renderCatalogRow = (item: CatalogRow) => {
    const name = (item.name || '').trim() || 'Quick Add';
    const calories = typeof item.calories === 'number' ? item.calories.toString() : '-';
    const fat = typeof item.fat === 'number' ? item.fat.toString() : '-';
    const carbs = typeof item.carbs === 'number' ? item.carbs.toString() : '-';
    const protein = typeof item.protein === 'number' ? item.protein.toString() : '-';
    const fiber = typeof item.fiber === 'number' ? item.fiber.toString() : '-';
    return (
      <Swipeable renderRightActions={renderRight(item)}>
        <TouchableOpacity onPress={() => handleItemPress(item)}>
          <View style={styles.item}>
            <View style={styles.itemContent}>
              <View style={styles.itemText}>
                <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">{name}</Text>
                <Text style={styles.calories} numberOfLines={1} ellipsizeMode="tail">{calories} Cal</Text>
                <Text style={styles.details} numberOfLines={1} ellipsizeMode="tail">
                  (F: {fat}g  C: {carbs}g  P: {protein}g  Fi: {fiber}g)
                </Text>
              </View>
              {item.barcode && (
                <View style={styles.barcodeContainer}>
                  <SymbolView name="barcode.viewfinder" size={20} tintColor="#034ea6" />
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  const showScroller = showAlphaScroller && flatIndexByLetter.size > 1;

  return (
    <>
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={rows}
        keyExtractor={(row, index) =>
          row.kind === 'header' ? `header:${row.title}` : (row.item.id != null ? `item:${row.item.id}` : `item:${row.item.name}-${index}`)
        }
        renderItem={({ item }) =>
          item.kind === 'header' ? (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{item.title}</Text>
            </View>
          ) : (
            renderCatalogRow(item.item)
          )
        }
        stickyHeaderIndices={stickyIndices}
        contentContainerStyle={showScroller ? styles.listContentWithScroller : undefined}
        getItemLayout={getRowLayout}
      />
      {showScroller && (
        <View
          style={styles.scroller}
          onLayout={(e) => {
            scrollerHeight.current = e.nativeEvent.layout.height;
          }}
          onTouchStart={(e) => {
            handleScrollerTouch(e.nativeEvent.locationY);
          }}
          onTouchMove={(e) => {
            handleScrollerTouch(e.nativeEvent.locationY);
          }}
          onTouchEnd={() => {
            setActiveLetter(null);
          }}
          accessibilityRole="adjustable"
          accessibilityLabel="Alphabetical scroller. Slide or tap to jump to a letter."
        >
          {ALPHABET.map((letter) => {
            const hasSection = flatIndexByLetter.has(letter);
            const isActive = activeLetter === letter;
            return (
              <View
                key={letter}
                pointerEvents="none"
                style={styles.scrollerLetterHit}
              >
                <Text
                  style={[
                    styles.scrollerLetter,
                    !hasSection && styles.scrollerLetterMissing,
                    isActive && hasSection && styles.scrollerLetterActive,
                  ]}
                >
                  {letter}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
    <QuantityModal
      key={pendingItem ? `${pendingItem.id ?? pendingItem.name}-${pendingItem.barcode ?? ''}` : 'closed'}
      visible={pendingItem != null}
      itemName={(pendingItem?.name || '').trim() || 'Quick Add'}
      onConfirm={handleQuantityConfirm}
      onCancel={() => setPendingItem(null)}
    />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  listContentWithScroller: {
    paddingRight: 28,
  },
  sectionHeader: {
    backgroundColor: '#f2f2f7',
    height: SECTION_HEADER_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
  },
  scroller: {
    position: 'absolute',
    right: 2,
    top: 0,
    bottom: 0,
    width: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Rows exactly fill the strip (no maxHeight cap) so touch Y maps 1:1 to letters.
  scrollerLetterHit: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollerLetter: {
    fontSize: 11,
    fontWeight: '600',
    color: '#007AFF',
    lineHeight: 14,
  },
  scrollerLetterMissing: {
    color: '#c7c7cc',
    fontWeight: '400',
  },
  scrollerLetterActive: {
    color: '#034ea6',
    fontWeight: '800',
  },
  item: {
    height: CATALOG_ROW_HEIGHT,
    justifyContent: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
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
});
