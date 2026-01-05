import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GoalsScreen() {
  const router = useRouter();
  const { from } = useLocalSearchParams();

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [goals, setGoals] = useState({
    calories: '',
    protein: '',
    fiber: '',
    fat: '',
    carbs: '',
  });

  const onSetGoals = async () => {
    if (goals.calories.trim()) await AsyncStorage.setItem('goal-calories', goals.calories);
    if (goals.protein.trim()) await AsyncStorage.setItem('goal-protein', goals.protein);
    if (goals.fiber.trim()) await AsyncStorage.setItem('goal-fiber', goals.fiber);
    if (goals.fat.trim()) await AsyncStorage.setItem('goal-fat', goals.fat);
    if (goals.carbs.trim()) await AsyncStorage.setItem('goal-carbs', goals.carbs);
    Alert.alert('Success', 'Goals set successfully!', [
      {
        text: 'OK',
        onPress: () => {
          if (from === 'signup') {
            router.replace('/(tabs)');
          } else {
            router.back();
          }
        }
      }
    ]);
  };

  useEffect(() => {
    const loadGoals = async () => {
      const calories = await AsyncStorage.getItem('goal-calories') || '';
      const protein = await AsyncStorage.getItem('goal-protein') || '';
      const fiber = await AsyncStorage.getItem('goal-fiber') || '';
      const fat = await AsyncStorage.getItem('goal-fat') || '';
      const carbs = await AsyncStorage.getItem('goal-carbs') || '';
      setGoals({ calories, protein, fiber, fat, carbs });
    };
    loadGoals();
  }, []);

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
            <Text style={styles.title}>Set Daily Goals</Text>

            <Text style={styles.label}>Goal Calories</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={goals.calories} onChangeText={(v) => setGoals((p) => ({ ...p, calories: v }))} />

            <Text style={styles.label}>Goal Protein (g)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={goals.protein} onChangeText={(v) => setGoals((p) => ({ ...p, protein: v }))} />

            <Text style={styles.label}>Goal Fiber (g)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={goals.fiber} onChangeText={(v) => setGoals((p) => ({ ...p, fiber: v }))} />

            <Text style={styles.label}>Goal Fat (g)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={goals.fat} onChangeText={(v) => setGoals((p) => ({ ...p, fat: v }))} />

            <Text style={styles.label}>Goal Carbs (g)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={goals.carbs} onChangeText={(v) => setGoals((p) => ({ ...p, carbs: v }))} />

            <View style={styles.buttons}>
              <TouchableOpacity style={styles.button} onPress={() => router.back()}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={onSetGoals}>
                <Text style={styles.buttonText}>Set Goals</Text>
              </TouchableOpacity>
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
  button: { backgroundColor: '#034ea6', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
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