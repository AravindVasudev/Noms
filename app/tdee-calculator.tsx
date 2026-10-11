import { setGoalsAsync } from '@/lib/goalsSlice';
import { useAppDispatch } from '@/lib/store';
import {
  ACTIVITY_OPTIONS,
  GOAL_OPTIONS,
  MACRO_SPLITS,
  TdeeResult,
  computeTdeeResult,
  ftInToCm,
  lbsToKg,
  type ActivityLevel,
  type Gender,
  type GoalKey,
  type MacroSplitKey,
} from '@/lib/tdee';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Units = 'imperial' | 'metric';

const SPLIT_KEYS: MacroSplitKey[] = ['moderate', 'low', 'high'];

export default function TdeeCalculatorScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [units, setUnits] = useState<Units>('imperial');
  const [gender, setGender] = useState<Gender>('male');
  const [activity, setActivity] = useState<ActivityLevel>('sedentary');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [feet, setFeet] = useState('');
  const [inches, setInches] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TdeeResult | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  React.useEffect(() => {
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

  const onCalculate = () => {
    setError(null);
    const ageNum = parseInt(age, 10);
    const weightNum = parseFloat(weight);
    const bodyFatNum = bodyFat.trim() === '' ? null : parseFloat(bodyFat);

    let weightKg: number;
    let heightCmNum: number;

    if (!Number.isFinite(ageNum) || ageNum < 10 || ageNum > 100) {
      setError('Enter an age between 10 and 100.');
      return;
    }
    if (!Number.isFinite(weightNum) || weightNum <= 0) {
      setError(units === 'imperial' ? 'Enter a valid weight in lbs.' : 'Enter a valid weight in kg.');
      return;
    }
    if (units === 'imperial') {
      const feetNum = parseInt(feet, 10);
      const inchesNum = inches.trim() === '' ? 0 : parseFloat(inches);
      if (!Number.isFinite(feetNum) || feetNum < 3 || feetNum > 8 || !Number.isFinite(inchesNum) || inchesNum < 0 || inchesNum >= 12) {
        setError('Enter a valid height (ft 3-8, in 0-11).');
        return;
      }
      weightKg = lbsToKg(weightNum);
      heightCmNum = ftInToCm(feetNum, inchesNum);
    } else {
      const hNum = parseFloat(heightCm);
      if (!Number.isFinite(hNum) || hNum < 100 || hNum > 250) {
        setError('Enter a valid height in cm (100-250).');
        return;
      }
      weightKg = weightNum;
      heightCmNum = hNum;
    }
    if (bodyFatNum != null && (!Number.isFinite(bodyFatNum) || bodyFatNum <= 0 || bodyFatNum >= 70)) {
      setError('Body fat % must be between 0 and 70, or left empty.');
      return;
    }

    setResult(
      computeTdeeResult({
        age: ageNum,
        gender,
        weightKg,
        heightCm: heightCmNum,
        activity,
        bodyFatPct: bodyFatNum,
      }),
    );
    Keyboard.dismiss();
  };

  const onUseMacros = async (goal: GoalKey, split: MacroSplitKey) => {
    if (!result) return;
    const calories = result.targets[goal];
    const macros = result.macros[goal][split];
    const goalLabel = GOAL_OPTIONS.find((g) => g.value === goal)?.label ?? goal;
    const splitLabel = MACRO_SPLITS[split].label;
    await dispatch(
      setGoalsAsync({
        calories: String(calories),
        protein: String(macros.protein),
        fiber: String(macros.fiber),
        fat: String(macros.fat),
        carbs: String(macros.carbs),
      }),
    );
    Alert.alert('Goals updated', `${goalLabel} · ${splitLabel}: ${calories} kcal applied.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  const cuttingLow = result != null && result.targets.cutting < (gender === 'male' ? 1500 : 1200);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            <View style={styles.container}>
              <Text style={styles.title}>TDEE Calculator</Text>
              <Text style={styles.subtitle}>Estimates use Mifflin-St Jeor (or Katch-McArdle when body fat % is given), like tdeecalculator.net.</Text>

              <Text style={styles.label}>Units</Text>
              <View style={styles.pills}>
                {(['imperial', 'metric'] as Units[]).map((u) => (
                  <Pressable key={u} onPress={() => setUnits(u)} style={[styles.pill, units === u && styles.pillSelected]}>
                    <Text style={[styles.pillText, units === u && styles.pillTextSelected]}>
                      {u === 'imperial' ? 'Imperial' : 'Metric'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>Gender</Text>
              <View style={styles.pills}>
                {(['male', 'female'] as Gender[]).map((g) => (
                  <Pressable key={g} onPress={() => setGender(g)} style={[styles.pill, gender === g && styles.pillSelected]}>
                    <Text style={[styles.pillText, gender === g && styles.pillTextSelected]}>
                      {g === 'male' ? 'Male' : 'Female'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>Age (years)</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={age} onChangeText={setAge} placeholder="30" />

              <Text style={styles.label}>{units === 'imperial' ? 'Weight (lbs)' : 'Weight (kg)'}</Text>
              <TextInput style={styles.input} keyboardType="decimal-pad" value={weight} onChangeText={setWeight} placeholder={units === 'imperial' ? '180' : '82'} />

              <Text style={styles.label}>{units === 'imperial' ? 'Height (ft / in)' : 'Height (cm)'}</Text>
              {units === 'imperial' ? (
                <View style={styles.heightRow}>
                  <TextInput style={[styles.input, styles.heightInput]} keyboardType="numeric" value={feet} onChangeText={setFeet} placeholder="5" />
                  <Text style={styles.heightUnit}>ft</Text>
                  <TextInput style={[styles.input, styles.heightInput]} keyboardType="decimal-pad" value={inches} onChangeText={setInches} placeholder="10" />
                  <Text style={styles.heightUnit}>in</Text>
                </View>
              ) : (
                <TextInput style={styles.input} keyboardType="decimal-pad" value={heightCm} onChangeText={setHeightCm} placeholder="178" />
              )}

              <Text style={styles.label}>Activity</Text>
              <View style={styles.activityList}>
                {ACTIVITY_OPTIONS.map((opt) => {
                  const selected = opt.value === activity;
                  return (
                    <Pressable key={opt.value} onPress={() => setActivity(opt.value)} style={[styles.activityRow, selected && styles.activityRowSelected]}>
                      <Text style={[styles.activityTitle, selected && styles.activityTitleSelected]}>{opt.label}</Text>
                      <Text style={[styles.activityHint, selected && styles.activityHintSelected]}>{opt.hint}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.label}>Body Fat % (optional)</Text>
              <TextInput style={styles.input} keyboardType="decimal-pad" value={bodyFat} onChangeText={setBodyFat} placeholder="e.g. 20" />

              {error && <Text style={styles.error}>{error}</Text>}

              <Pressable style={styles.calculateButton} onPress={onCalculate}>
                <Text style={styles.calculateText}>Calculate</Text>
              </Pressable>

              {result && (
                <View style={styles.results}>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Your numbers</Text>
                    <Text style={styles.summaryLine}>BMR: {result.bmr} kcal/day{result.usedKatchMcArdle ? ' (Katch-McArdle)' : ''}</Text>
                    <Text style={styles.summaryLine}>TDEE: {result.tdee} kcal/day</Text>
                    <Text style={styles.summaryNote}>Fiber estimated at ~14g per 1000 kcal.</Text>
                    {cuttingLow && (
                      <Text style={styles.warning}>Cutting target is very low — consider a smaller deficit or check with a professional.</Text>
                    )}
                  </View>

                  {GOAL_OPTIONS.map((goal) => (
                    <View key={goal.value} style={styles.goalSection}>
                      <Text style={styles.goalTitle}>
                        {goal.label}: {result.targets[goal.value]} kcal
                      </Text>
                      {SPLIT_KEYS.map((split) => {
                        const m = result.macros[goal.value][split];
                        return (
                          <View key={split} style={styles.macroCard}>
                            <View style={styles.macroHeader}>
                              <Text style={styles.macroTitle}>{MACRO_SPLITS[split].label}</Text>
                              <Text style={styles.macroDesc}>{MACRO_SPLITS[split].description}</Text>
                            </View>
                            <Text style={styles.macroLine}>
                              P {m.protein}g · C {m.carbs}g · F {m.fat}g · Fiber {m.fiber}g
                            </Text>
                            <Pressable style={styles.useButton} onPress={() => onUseMacros(goal.value, split)}>
                              <Text style={styles.useText}>Use these goals</Text>
                            </Pressable>
                          </View>
                        );
                      })}
                    </View>
                  ))}
                </View>
              )}

              <Pressable style={styles.cancelLink} onPress={() => router.back()}>
                <Text style={styles.cancelText}>Back to Goals</Text>
              </Pressable>
            </View>
          </ScrollView>
          {keyboardVisible && (
            <View style={[styles.keyboardAccessory, { bottom: keyboardHeight }]}>
              <Pressable onPress={() => Keyboard.dismiss()} style={styles.doneButton}>
                <Text style={styles.doneText}>Done</Text>
              </Pressable>
            </View>
          )}
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, paddingBottom: 100 },
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 4, color: '#034ea6' },
  subtitle: { fontSize: 13, color: '#666', marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 12, marginBottom: 6, color: '#034ea6' },
  input: { borderWidth: 0, backgroundColor: '#f0f0f3', borderRadius: 20, paddingVertical: 10, paddingHorizontal: 12 },
  pills: { flexDirection: 'row', gap: 8 },
  pill: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, backgroundColor: '#f0f0f3' },
  pillSelected: { backgroundColor: '#007AFF' },
  pillText: { fontSize: 14, fontWeight: '600', color: '#034ea6' },
  pillTextSelected: { color: '#fff' },
  heightRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heightInput: { flex: 1 },
  heightUnit: { fontSize: 14, color: '#333' },
  activityList: { gap: 8 },
  activityRow: { backgroundColor: '#f0f0f3', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 },
  activityRowSelected: { backgroundColor: '#007AFF' },
  activityTitle: { fontSize: 14, fontWeight: '600', color: '#111' },
  activityTitleSelected: { color: '#fff' },
  activityHint: { fontSize: 12, color: '#666' },
  activityHintSelected: { color: '#e6f0ff' },
  error: { color: '#c00', marginTop: 12, fontSize: 14 },
  calculateButton: { backgroundColor: '#007AFF', borderRadius: 20, paddingVertical: 12, alignItems: 'center', marginTop: 16 },
  calculateText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  results: { marginTop: 16, gap: 16 },
  summaryCard: { backgroundColor: '#f2f2f7', borderRadius: 12, padding: 12 },
  summaryTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  summaryLine: { fontSize: 14, marginTop: 2 },
  summaryNote: { fontSize: 12, color: '#666', marginTop: 6 },
  warning: { fontSize: 13, color: '#c00', marginTop: 6 },
  goalSection: { gap: 8 },
  goalTitle: { fontSize: 16, fontWeight: '700', color: '#034ea6' },
  macroCard: { backgroundColor: '#f2f2f7', borderRadius: 12, padding: 12, gap: 6 },
  macroHeader: { gap: 2 },
  macroTitle: { fontSize: 14, fontWeight: '600' },
  macroDesc: { fontSize: 12, color: '#666' },
  macroLine: { fontSize: 14 },
  useButton: { backgroundColor: '#007AFF', borderRadius: 16, paddingVertical: 8, alignItems: 'center', marginTop: 4 },
  useText: { color: '#fff', fontWeight: '600' },
  cancelLink: { alignItems: 'center', marginTop: 20 },
  cancelText: { color: '#007AFF', fontSize: 15 },
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
