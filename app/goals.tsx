import { setGoalsAsync } from '@/lib/goalsSlice';
import { setSignedUpAsync } from '@/lib/profileSlice';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Button, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function GoalsScreen() {
  const router = useRouter();
  const { from } = useLocalSearchParams();
  const dispatch = useAppDispatch();
  const goals = useAppSelector(state => state.goals);
  const { colors } = useAppTheme();

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [localGoals, setLocalGoals] = useState({
    calories: '',
    protein: '',
    fiber: '',
    fat: '',
    carbs: '',
    tdee: '',
  });

  useEffect(() => {
    setLocalGoals(goals);
  }, [goals]);

  const onSetGoals = async () => {
    dispatch(setGoalsAsync(localGoals));
    if (from === 'signup') {
      await dispatch(setSignedUpAsync(true));
    }
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
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.systemBackground }}>
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={[styles.container, { backgroundColor: colors.systemBackground }]}>
            <Text style={[styles.title, { color: colors.label }]}>Set Daily Goals</Text>

            <TouchableOpacity style={[styles.tdeeButton, { backgroundColor: colors.systemBlue }]} onPress={() => router.push('/tdee-calculator')}>
              <Text style={[styles.tdeeText, { color: colors.onAccent }]}>Use TDEE Calculator</Text>
            </TouchableOpacity>

            <View style={styles.fieldRow}>
              <Text style={[styles.label, styles.labelInline, { color: colors.label }]}>TDEE (kcal)</Text>
              <TextInput style={[styles.input, styles.inputInline, { backgroundColor: colors.inputBackground, color: colors.label }]} keyboardType="numeric" placeholderTextColor={colors.secondaryLabel} value={localGoals.tdee} onChangeText={(v) => setLocalGoals((p) => ({ ...p, tdee: v }))} />
            </View>
            <Text style={[styles.hint, { color: colors.secondaryLabel }]}>Days between your goal and TDEE show yellow in the diary calendar.</Text>

            <View style={styles.fieldRow}>
              <Text style={[styles.label, styles.labelInline, { color: colors.label }]}>Calories</Text>
              <TextInput style={[styles.input, styles.inputInline, { backgroundColor: colors.inputBackground, color: colors.label }]} keyboardType="numeric" placeholderTextColor={colors.secondaryLabel} value={localGoals.calories} onChangeText={(v) => setLocalGoals((p) => ({ ...p, calories: v }))} />
            </View>

            <View style={styles.fieldRow}>
              <Text style={[styles.label, styles.labelInline, { color: colors.label }]}>Protein (g)</Text>
              <TextInput style={[styles.input, styles.inputInline, { backgroundColor: colors.inputBackground, color: colors.label }]} keyboardType="numeric" placeholderTextColor={colors.secondaryLabel} value={localGoals.protein} onChangeText={(v) => setLocalGoals((p) => ({ ...p, protein: v }))} />
            </View>

            <View style={styles.fieldRow}>
              <Text style={[styles.label, styles.labelInline, { color: colors.label }]}>Fiber (g)</Text>
              <TextInput style={[styles.input, styles.inputInline, { backgroundColor: colors.inputBackground, color: colors.label }]} keyboardType="numeric" placeholderTextColor={colors.secondaryLabel} value={localGoals.fiber} onChangeText={(v) => setLocalGoals((p) => ({ ...p, fiber: v }))} />
            </View>

            <View style={styles.fieldRow}>
              <Text style={[styles.label, styles.labelInline, { color: colors.label }]}>Fat (g)</Text>
              <TextInput style={[styles.input, styles.inputInline, { backgroundColor: colors.inputBackground, color: colors.label }]} keyboardType="numeric" placeholderTextColor={colors.secondaryLabel} value={localGoals.fat} onChangeText={(v) => setLocalGoals((p) => ({ ...p, fat: v }))} />
            </View>

            <View style={styles.fieldRow}>
              <Text style={[styles.label, styles.labelInline, { color: colors.label }]}>Carbs (g)</Text>
              <TextInput style={[styles.input, styles.inputInline, { backgroundColor: colors.inputBackground, color: colors.label }]} keyboardType="numeric" placeholderTextColor={colors.secondaryLabel} value={localGoals.carbs} onChangeText={(v) => setLocalGoals((p) => ({ ...p, carbs: v }))} />
            </View>

            <View style={styles.buttons}>
              <Button title="Cancel" onPress={() => router.back()} />
              <Button title="Set Goals" onPress={onSetGoals} />
            </View>
          </View>
        </ScrollView>
        {keyboardVisible && (
          <View style={[styles.keyboardAccessory, { bottom: keyboardHeight, backgroundColor: colors.systemGroupedBackground, borderColor: colors.separator }]}>
            <TouchableOpacity onPress={() => Keyboard.dismiss()} style={styles.doneButton}>
              <Text style={[styles.doneText, { color: colors.systemBlue }]}>Done</Text>
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
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 8, marginBottom: 6 },
  hint: { fontSize: 12, marginBottom: 4 },
  input: { borderWidth: 0, borderRadius: 20, paddingVertical: 10, paddingHorizontal: 12 },
  buttons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 8 },
  labelInline: { marginTop: 0, marginBottom: 0, marginRight: 12, minWidth: 90 },
  inputInline: { flex: 1, paddingVertical: 10 },
  tdeeButton: { borderRadius: 20, paddingVertical: 12, alignItems: 'center', marginBottom: 12 },
  tdeeText: { fontWeight: '600', fontSize: 16 },
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
});