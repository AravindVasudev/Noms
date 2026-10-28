import BarcodeScanner from '@/components/ui/barcode-scanner';
import CatalogEntries from '@/components/ui/catalog-entries';
import QuantityModal from '@/components/ui/quantity-modal';
import catalogStore, { CatalogRow } from '@/lib/catalog-store';
import { addEntryAsync } from '@/lib/diarySlice';
import { DEFAULT_QUANTITY } from '@/lib/quantity';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SearchScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { colors } = useAppTheme();
  const { date: paramDate } = useLocalSearchParams();
  const catalog = useAppSelector(state => state.catalog.catalog);
  const [searchQuery, setSearchQuery] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [pendingBarcodeItem, setPendingBarcodeItem] = useState<CatalogRow | null>(null);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleBarcodeScanned = async (barcode: string) => {
    try {
      const catalogItem = await catalogStore.getEntryByBarcode(barcode);
      if (catalogItem) {
        setScannerVisible(false);
        setPendingBarcodeItem(catalogItem);
      } else {
        router.push({ pathname: '/add', params: { ...paramDate ? { date: paramDate } : {}, barcode } });
      }
    } catch (error) {
      console.error('Barcode scan error:', error);
      Alert.alert('Error', `Failed to process barcode: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleBarcodeQuantityConfirm = (quantity: number) => {
    if (!pendingBarcodeItem) return;
    const date = paramDate ? new Date(paramDate as string) : new Date();
    dispatch(addEntryAsync({
      name: pendingBarcodeItem.name,
      calories: pendingBarcodeItem.calories || 0,
      fat: pendingBarcodeItem.fat,
      protein: pendingBarcodeItem.protein,
      carbs: pendingBarcodeItem.carbs,
      fiber: pendingBarcodeItem.fiber,
      quantity: quantity ?? DEFAULT_QUANTITY,
      date,
    }));
    setPendingBarcodeItem(null);
    router.replace('/(tabs)');
  };

  const isSearching = searchQuery.trim().length > 0;

  const filteredCatalog = useMemo(() => {
    const base = !isSearching
      ? catalog
      : catalog.filter((item) =>
        (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()),
      );
    return base.slice().sort((a, b) =>
      (a.name || '').trim().localeCompare((b.name || '').trim(), undefined, { sensitivity: 'base' }),
    );
  }, [catalog, searchQuery, isSearching]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: any) => {
      setKeyboardVisible(true);
      setKeyboardHeight(e?.endCoordinates?.height || 0);
    };

    const onHide = () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.systemBackground }]}>
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={colors.systemBlue} />
          <Text style={[styles.backText, { color: colors.systemBlue }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.label }]}>Catalog</Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.inputBackground, color: colors.label }]}
          placeholder="Search catalog..."
          placeholderTextColor={colors.secondaryLabel}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity 
          style={[styles.barcodeButton, { backgroundColor: colors.systemBlue }]}
          onPress={() => setScannerVisible(true)}
        >
          <SymbolView name="barcode.viewfinder" size={20} tintColor={colors.onAccent} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: colors.systemBlue }]}
          onPress={() => router.push({ pathname: '/add', params: paramDate ? { date: paramDate } : {} })}
        >
          <Text style={[styles.addButtonText, { color: colors.onAccent }]}>+</Text>
        </TouchableOpacity>
      </View>
      {filteredCatalog.length === 0 ? (
        <Pressable
          style={styles.emptyContainer}
          onPress={() => router.push({ pathname: '/add', params: paramDate ? { date: paramDate } : {} })}
          accessibilityRole="button"
        >
          <Text style={[styles.emptyText, { color: colors.secondaryLabel }]}>Catalog is empty. Click here to add.</Text>
        </Pressable>
      ) : (
        <CatalogEntries items={filteredCatalog} date={paramDate ? new Date(paramDate as string) : new Date()} showAlphaScroller={!isSearching} />
      )}
      {keyboardVisible && (
        <View style={[styles.keyboardAccessory, { bottom: keyboardHeight, backgroundColor: colors.systemGroupedBackground, borderColor: colors.separator }]}>
          <TouchableOpacity onPress={() => Keyboard.dismiss()} style={styles.doneButton}>
            <Text style={[styles.doneText, { color: colors.systemBlue }]}>Done</Text>
          </TouchableOpacity>
        </View>
      )}
      </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
      <BarcodeScanner 
        visible={scannerVisible} 
        onClose={() => setScannerVisible(false)} 
        onBarcodeScanned={handleBarcodeScanned}
      />
      <QuantityModal
        key={pendingBarcodeItem ? `${pendingBarcodeItem.id ?? pendingBarcodeItem.name}-${pendingBarcodeItem.barcode ?? ''}` : 'closed'}
        visible={pendingBarcodeItem != null}
        itemName={(pendingBarcodeItem?.name || '').trim() || 'Scanned item'}
        onConfirm={handleBarcodeQuantityConfirm}
        onCancel={() => setPendingBarcodeItem(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 70,
  },
  backText: {
    fontSize: 17,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerSpacer: {
    minWidth: 70,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderWidth: 0,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 16,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 24,
    lineHeight: 26,
    fontWeight: '600',
  },
  barcodeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barcodeButtonText: {
    fontSize: 24,
    lineHeight: 26,
    fontWeight: '600',
  },
  keyboardAccessory: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  doneButton: { paddingHorizontal: 12, paddingVertical: 6 },
  doneText: { fontWeight: '600', fontSize: 16 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});
