import { setGoalsAsync } from '@/lib/goalsSlice';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Button, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GoalsScreen() {
  const router = useRouter();
  const { from } = useLocalSearchParams();
  const dispatch = useAppDispatch();
  const goals = useAppSelector(state => state.goals);

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [localGoals, setLocalGoals] = useState({
    calories: '',
    protein: '',
    fiber: '',
    fat: '',
    carbs: '',
  });

  useEffect(() => {
    setLocalGoals(goals);
  }, [goals]);

  const onSetGoals = async () => {
    dispatch(setGoalsAsync(localGoals));
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
            <Text style={styles.title}>Set Daily Goals</Text>

            <View style={styles.fieldRow}>
              <Text style={[styles.label, styles.labelInline]}>Calories</Text>
              <TextInput style={[styles.input, styles.inputInline]} keyboardType="numeric" value={localGoals.calories} onChangeText={(v) => setLocalGoals((p) => ({ ...p, calories: v }))} />
            </View>

            <View style={styles.fieldRow}>
              <Text style={[styles.label, styles.labelInline]}>Protein (g)</Text>
              <TextInput style={[styles.input, styles.inputInline]} keyboardType="numeric" value={localGoals.protein} onChangeText={(v) => setLocalGoals((p) => ({ ...p, protein: v }))} />
            </View>

            <View style={styles.fieldRow}>
              <Text style={[styles.label, styles.labelInline]}>Fiber (g)</Text>
              <TextInput style={[styles.input, styles.inputInline]} keyboardType="numeric" value={localGoals.fiber} onChangeText={(v) => setLocalGoals((p) => ({ ...p, fiber: v }))} />
            </View>

            <View style={styles.fieldRow}>
              <Text style={[styles.label, styles.labelInline]}>Fat (g)</Text>
              <TextInput style={[styles.input, styles.inputInline]} keyboardType="numeric" value={localGoals.fat} onChangeText={(v) => setLocalGoals((p) => ({ ...p, fat: v }))} />
            </View>

            <View style={styles.fieldRow}>
              <Text style={[styles.label, styles.labelInline]}>Carbs (g)</Text>
              <TextInput style={[styles.input, styles.inputInline]} keyboardType="numeric" value={localGoals.carbs} onChangeText={(v) => setLocalGoals((p) => ({ ...p, carbs: v }))} />
            </View>

            <View style={styles.buttons}>
              <Button title="Cancel" onPress={() => router.back()} />
              <Button title="Set Goals" onPress={onSetGoals} />
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