import { addEntryAsync } from '@/lib/diarySlice';
import { useAppDispatch } from '@/lib/store';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Button, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { date: paramDate } = useLocalSearchParams();
  const today = new Date();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [nutrition, setNutrition] = useState({
    name: '',
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
    Keyboard.dismiss();
    router.back();
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
    <SafeAreaView style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.container}>
            <Text style={styles.title}>Add Entry</Text>
            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.input} value={nutrition.name} onChangeText={(v) => setNutrition((p) => ({ ...p, name: v }))} />

            <Text style={styles.label}>Calories</Text>
            <TextInput style={styles.input} keyboardType="numeric" placeholder="(required)" value={nutrition.calories} onChangeText={(v) => setNutrition((p) => ({ ...p, calories: v }))} />

            <Text style={styles.label}>Fat (g)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={nutrition.fat} onChangeText={(v) => setNutrition((p) => ({ ...p, fat: v }))} />

            <Text style={styles.label}>Protein (g)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={nutrition.protein} onChangeText={(v) => setNutrition((p) => ({ ...p, protein: v }))} />

            <Text style={styles.label}>Carbs (g)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={nutrition.carbs} onChangeText={(v) => setNutrition((p) => ({ ...p, carbs: v }))} />

            <Text style={styles.label}>Fiber (g)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={nutrition.fiber} onChangeText={(v) => setNutrition((p) => ({ ...p, fiber: v }))} />

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
  label: { fontSize: 14, fontWeight: '600', marginTop: 8, marginBottom: 6, color: '#034ea6' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8 },
  buttons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
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
