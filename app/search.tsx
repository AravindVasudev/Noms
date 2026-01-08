import BarcodeScanner from '@/components/ui/barcode-scanner';
import CatalogEntries from '@/components/ui/catalog-entries';
import catalogStore from '@/lib/catalog-store';
import { addEntryAsync } from '@/lib/diarySlice';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SearchScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { date: paramDate } = useLocalSearchParams();
  const catalog = useAppSelector(state => state.catalog.catalog);
  const [searchQuery, setSearchQuery] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [scannerVisible, setScannerVisible] = useState(false);

  const handleBarcodeScanned = async (barcode: string) => {
    try {
      const catalogItem = await catalogStore.getEntryByBarcode(barcode);
      if (catalogItem) {
        const date = paramDate ? new Date(paramDate as string) : new Date();
        dispatch(addEntryAsync({
          name: catalogItem.name,
          calories: catalogItem.calories || 0,
          fat: catalogItem.fat,
          protein: catalogItem.protein,
          carbs: catalogItem.carbs,
          fiber: catalogItem.fiber,
          date,
        }));
        router.replace('/(tabs)/');
      } else {
        router.replace({ pathname: '/add', params: { ...paramDate ? { date: paramDate } : {}, barcode } });
      }
    } catch (error) {
      console.error('Barcode scan error:', error);
      Alert.alert('Error', `Failed to process barcode: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const filteredCatalog = useMemo(() => {
    if (!searchQuery.trim()) {
      return catalog;
    }
    const query = searchQuery.toLowerCase();
    return catalog.filter((item) => 
      (item.name || '').toLowerCase().includes(query)
    );
  }, [catalog, searchQuery]);

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
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search catalog..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity 
          style={styles.barcodeButton}
          onPress={() => setScannerVisible(true)}
        >
          <SymbolView name="barcode.viewfinder" size={20} tintColor="#fff" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.replace({ pathname: '/add', params: paramDate ? { date: paramDate } : {} })}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      {filteredCatalog.length === 0 ? (
        <Pressable
          style={styles.emptyContainer}
          onPress={() => router.push({ pathname: '/add', params: paramDate ? { date: paramDate } : {} })}
          accessibilityRole="button"
        >
          <Text style={styles.emptyText}>Catalog is empty. Click here to add.</Text>
        </Pressable>
      ) : (
        <CatalogEntries items={filteredCatalog} date={paramDate ? new Date(paramDate as string) : new Date()} />
      )}
      {keyboardVisible && (
        <View style={[styles.keyboardAccessory, { bottom: keyboardHeight }]}>
          <TouchableOpacity onPress={() => Keyboard.dismiss()} style={styles.doneButton}>
            <Text style={styles.doneText}>Done</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
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
    backgroundColor: '#f0f0f3',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 16,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
    lineHeight: 26,
    fontWeight: '600',
  },
  barcodeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  barcodeButtonText: {
    color: '#fff',
    fontSize: 24,
    lineHeight: 26,
    fontWeight: '600',
  },
  keyboardAccessory: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 44,
    backgroundColor: '#f1f1f1',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#ccc',
  },
  doneButton: { paddingHorizontal: 12, paddingVertical: 6 },
  doneText: { color: '#007AFF', fontWeight: '600', fontSize: 16 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
});
