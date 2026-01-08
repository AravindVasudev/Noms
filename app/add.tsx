import { addCatalogItemAsync } from '@/lib/catalogSlice';
import { addEntryAsync } from '@/lib/diarySlice';
import { useAppDispatch } from '@/lib/store';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React, { useEffect, useState } from 'react';
import { Alert, Button, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { date: paramDate, barcode } = useLocalSearchParams();
  const today = new Date();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [nutrition, setNutrition] = useState({
    name: '',
    barcode: (barcode as string) || null,
    calories: '',
    fat: '',
    protein: '',
    carbs: '',
    fiber: '',
    date: paramDate ? new Date(paramDate as string) : today,
  });

  const onAdd = () => {
    const name = (nutrition.name || '').trim() || 'Quick Add';
    const calories = (nutrition.calories || '').trim();
    
    // Validate name is required for barcoded items
    if (nutrition.barcode && (nutrition.name || '').trim().length === 0) {
      Alert.alert('Validation', 'Name is required to store barcoded items');
      return;
    }
    
    if (calories.length === 0) {
      Alert.alert('Validation', 'Calories is required');
      return;
    }
    const caloriesNum = parseInt(calories, 10);
    if (!Number.isFinite(caloriesNum) || isNaN(caloriesNum)) {
      Alert.alert('Validation', 'Calories must be a valid number');
      return;
    }

    const fatNum = nutrition.fat.trim() === '' ? null : parseInt(nutrition.fat, 10);
    const proteinNum = nutrition.protein.trim() === '' ? null : parseInt(nutrition.protein, 10);
    const carbsNum = nutrition.carbs.trim() === '' ? null : parseInt(nutrition.carbs, 10);
    const fiberNum = nutrition.fiber.trim() === '' ? null : parseInt(nutrition.fiber, 10);

    dispatch(addEntryAsync({ name, calories: caloriesNum, fat: fatNum, protein: proteinNum, carbs: carbsNum, fiber: fiberNum, date: nutrition.date }));
    
    // Add to catalog if name is provided (not just "Quick Add")
    if ((nutrition.name || '').trim().length > 0) {
      dispatch(addCatalogItemAsync({ name, barcode: nutrition.barcode, calories: caloriesNum, fat: fatNum, protein: proteinNum, carbs: carbsNum, fiber: fiberNum }));
    }
    
    Keyboard.dismiss();
    router.dismissAll();
    router.replace('/(tabs)/');
  };

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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.container}>
            <Text style={styles.title}>Add Entry</Text>
            <View style={styles.noteContainer}>
              <Text style={styles.note}>
                {nutrition.barcode 
                  ? 'Entry will be stored w/ barcode for convenience' 
                  : 'Named entries will be stored in catalog for reuse'}
              </Text>
              {nutrition.barcode && (
                <SymbolView name="barcode.viewfinder" size={14} tintColor="#888" style={styles.barcodeIcon} />
              )}
            </View>
            <View style={styles.fieldRow}>
              <Text style={[styles.label, styles.labelInline]}>Name</Text>
              <TextInput 
                style={[styles.input, styles.inputInline]} 
                placeholder={nutrition.barcode ? '(required)' : ''}
                placeholderTextColor="#666"
                value={nutrition.name} 
                onChangeText={(v) => setNutrition((p) => ({ ...p, name: v }))} 
              />
            </View>

            <View style={styles.fieldRow}>
              <Text style={[styles.label, styles.labelInline]}>Calories</Text>
              <TextInput 
                style={[styles.input, styles.inputInline]} 
                keyboardType="numeric" 
                placeholder="(required)" 
                placeholderTextColor="#666"
                value={nutrition.calories} 
                onChangeText={(v) => setNutrition((p) => ({ ...p, calories: v }))} 
              />
            </View>

            <View style={styles.fieldRow}>
              <Text style={[styles.label, styles.labelInline]}>Fat (g)</Text>
              <TextInput style={[styles.input, styles.inputInline]} keyboardType="numeric" value={nutrition.fat} onChangeText={(v) => setNutrition((p) => ({ ...p, fat: v }))} />
            </View>

            <View style={styles.fieldRow}>
              <Text style={[styles.label, styles.labelInline]}>Protein (g)</Text>
              <TextInput style={[styles.input, styles.inputInline]} keyboardType="numeric" value={nutrition.protein} onChangeText={(v) => setNutrition((p) => ({ ...p, protein: v }))} />
            </View>

            <View style={styles.fieldRow}>
              <Text style={[styles.label, styles.labelInline]}>Carbs (g)</Text>
              <TextInput style={[styles.input, styles.inputInline]} keyboardType="numeric" value={nutrition.carbs} onChangeText={(v) => setNutrition((p) => ({ ...p, carbs: v }))} />
            </View>

            <View style={styles.fieldRow}>
              <Text style={[styles.label, styles.labelInline]}>Fiber (g)</Text>
              <TextInput style={[styles.input, styles.inputInline]} keyboardType="numeric" value={nutrition.fiber} onChangeText={(v) => setNutrition((p) => ({ ...p, fiber: v }))} />
            </View>

            <View style={styles.buttons}>
              <Button title="Cancel" onPress={() => router.back()} />
              <Button title="Add" onPress={onAdd} />
            </View>
          </View>
        </ScrollView>
        {keyboardVisible && (
          <View style={[styles.keyboardAccessory, { bottom: keyboardHeight }]}>
            <TouchableOpacity onPress={() => Keyboard.dismiss()} style={styles.doneButton}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingBottom: 100 },
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 12, color: '#034ea6' },
  noteContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  note: { fontSize: 12, color: '#888' },
  barcodeIcon: { marginLeft: 6 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 8, marginBottom: 6, color: '#034ea6' },
  input: { borderWidth: 0, backgroundColor: '#f0f0f3', borderRadius: 20, paddingVertical: 10, paddingHorizontal: 12 },
  buttons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 8 },
  labelInline: { marginTop: 0, marginBottom: 0, marginRight: 12, minWidth: 90 },
  inputInline: { flex: 1, paddingVertical: 10 },
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
});
