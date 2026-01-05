import { useDiary } from '@/app/diary-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Button, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';

export default function AddScreen() {
  const router = useRouter();
  const { addEntry } = useDiary();

  const { date: paramDate } = useLocalSearchParams();
  const todayISO = new Date().toISOString().slice(0, 10);
  const [nutrition, setNutrition] = useState({
    name: '',
    calories: '',
    fat: '',
    protein: '',
    carbs: '',
    fiber: '',
    date: (paramDate as string) || todayISO,
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

    addEntry({ name, calories: caloriesNum, fat: fatNum, protein: proteinNum, carbs: carbsNum, fiber: fiberNum, date: nutrition.date });
    Keyboard.dismiss();
    router.back();
  };

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.container}>
            <Text style={styles.title}>Add Entry</Text>
            <Text>aaa {paramDate}</Text>

            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.input} value={nutrition.name} onChangeText={(v) => setNutrition((p) => ({ ...p, name: v }))} />

            <Text style={styles.label}>Calories</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={nutrition.calories} onChangeText={(v) => setNutrition((p) => ({ ...p, calories: v }))} />

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
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, justifyContent: 'center' },
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 8, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8 },
  buttons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
});
