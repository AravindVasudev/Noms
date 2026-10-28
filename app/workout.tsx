import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/hooks/use-app-theme';
import { useWorkoutElapsed } from '@/hooks/use-workout-elapsed';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import {
  addExerciseToWorkoutAsync,
  addSetAsync,
  discardWorkoutAsync,
  finishWorkoutAsync,
  pauseWorkoutAsync,
  removeExerciseFromWorkoutAsync,
  removeSetAsync,
  resumeWorkoutAsync,
  startWorkoutAsync,
  updateSetAsync,
} from '@/lib/trainingSlice';
import { KG_TO_LB, WeightUnit } from '@/lib/weight';
import { formatElapsed, getWorkoutName } from '@/lib/workout-time';
import type { WorkoutSet } from '@/lib/workout-store';

function convertWeight(weight: number, from: WeightUnit, to: WeightUnit): number {
  if (from === to) return weight;
  return from === 'kg' ? weight * KG_TO_LB : weight / KG_TO_LB;
}

function schemeGreen(scheme: 'light' | 'dark'): string {
  return scheme === 'dark' ? '#30D158' : '#34C759';
}

const round1 = (n: number) => Math.round(n * 10) / 10;

function SetRow({ set, unit, previous }: { set: WorkoutSet; unit: string; previous: string }) {
  const dispatch = useAppDispatch();
  const { colors, scheme } = useAppTheme();
  const green = schemeGreen(scheme);
  const [weight, setWeight] = useState(() => (set.weight == null ? '' : String(set.weight)));
  const [reps, setReps] = useState(() => (set.reps == null ? '' : String(set.reps)));

  const commitWeight = () => {
    const trimmed = weight.trim();
    const value = trimmed === '' ? null : parseFloat(trimmed);
    if (value !== null && (!Number.isFinite(value) || value < 0)) {
      setWeight(set.weight == null ? '' : String(set.weight));
      return;
    }
    if (value !== set.weight) dispatch(updateSetAsync({ id: set.id, weight: value }));
  };

  const commitReps = () => {
    const trimmed = reps.trim();
    const value = trimmed === '' ? null : parseInt(trimmed, 10);
    if (value !== null && (!Number.isFinite(value) || value < 0)) {
      setReps(set.reps == null ? '' : String(set.reps));
      return;
    }
    if (value !== set.reps) dispatch(updateSetAsync({ id: set.id, reps: value }));
  };

  const confirmDeleteSet = () => {
    Alert.alert(`Delete Set ${set.setIndex}?`, undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => dispatch(removeSetAsync(set.id)),
      },
    ]);
  };

  const toggleCompleted = () => {
    // Flush pending input first: tapping ✓ right after typing must not read
    // stale Redux state (blur-commit hasn't propagated yet).
    const rTrim = reps.trim();
    const r = rTrim === '' ? null : parseInt(rTrim, 10);
    if (r == null || !Number.isFinite(r) || r < 0) return;
    const wTrim = weight.trim();
    const w = wTrim === '' ? null : parseFloat(wTrim);
    if (w === null || (Number.isFinite(w) && w >= 0)) {
      dispatch(updateSetAsync({ id: set.id, reps: r, weight: w }));
    } else {
      dispatch(updateSetAsync({ id: set.id, reps: r }));
    }
    dispatch(updateSetAsync({ id: set.id, completed: !set.completed }));
  };

  return (
    <View style={styles.setRow}>
      <Pressable
        onPress={confirmDeleteSet}
        style={styles.setIndexBadge}
        accessibilityRole="button"
        accessibilityLabel={`Delete set ${set.setIndex}`}
      >
        <Text style={[styles.setIndex, { color: colors.secondaryLabel }]}>{set.setIndex}</Text>
      </Pressable>
      <Text style={[styles.previous, { color: colors.secondaryLabel }]} numberOfLines={1}>
        {previous}
      </Text>
      <TextInput
        style={[styles.setInput, { backgroundColor: colors.inputBackground, color: colors.label }]}
        value={weight}
        onChangeText={setWeight}
        onBlur={commitWeight}
        placeholder="–"
        placeholderTextColor={colors.secondaryLabel}
        keyboardType="decimal-pad"
        returnKeyType="done"
        accessibilityLabel={`Set ${set.setIndex} weight in ${unit}`}
      />
      <TextInput
        style={[styles.setInput, { backgroundColor: colors.inputBackground, color: colors.label }]}
        value={reps}
        onChangeText={setReps}
        onBlur={commitReps}
        placeholder="–"
        placeholderTextColor={colors.secondaryLabel}
        keyboardType="number-pad"
        returnKeyType="done"
        accessibilityLabel={`Set ${set.setIndex} reps`}
      />
      <Pressable
        onPress={toggleCompleted}
        style={[
          styles.checkCell,
          { backgroundColor: colors.inputBackground },
          set.completed && { backgroundColor: green },
        ]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: set.completed }}
        accessibilityLabel={`Mark set ${set.setIndex} complete`}
      >
        <Text
          style={[
            styles.checkText,
            { color: colors.secondaryLabel },
            set.completed && { color: colors.onAccent },
          ]}
        >
          ✓
        </Text>
      </Pressable>
    </View>
  );
}

export default function WorkoutScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { colors, scheme } = useAppTheme();
  const green = schemeGreen(scheme);
  const activeWorkout = useAppSelector((state) => state.training.activeWorkout);
  const exercises = useAppSelector((state) => state.training.exercises);
  const allSets = useAppSelector((state) => state.training.sets);
  const completedWorkouts = useAppSelector((state) => state.training.workouts);
  const weightUnit = useAppSelector((state) => state.training.weightUnit);
  const [query, setQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [adding, setAdding] = useState(false);
  const elapsed = useWorkoutElapsed(activeWorkout);

  const activeSets = useMemo(
    () => (activeWorkout ? allSets.filter((s) => s.workoutId === activeWorkout.id) : []),
    [allSets, activeWorkout]
  );

  const grouped = useMemo(() => {
    const map = new Map<number, WorkoutSet[]>();
    for (const s of activeSets) {
      const list = map.get(s.exerciseId) ?? [];
      list.push(s);
      map.set(s.exerciseId, list);
    }
    return [...map.entries()].sort((a, b) => a[1][0].id - b[1][0].id);
  }, [activeSets]);

  // Previous performance per exercise: completed sets from the most recent
  // completed workout containing that exercise, aligned by set order.
  const previousSetsByExercise = useMemo(() => {
    const map = new Map<number, WorkoutSet[]>();
    const needed = new Set(grouped.map(([id]) => id));
    if (needed.size === 0) return map;
    for (const w of completedWorkouts) {
      if (needed.size === 0) break;
      const byEx = new Map<number, WorkoutSet[]>();
      for (const s of allSets) {
        if (s.workoutId !== w.id || !s.completed) continue;
        if (!needed.has(s.exerciseId) || map.has(s.exerciseId)) continue;
        const list = byEx.get(s.exerciseId) ?? [];
        list.push(s);
        byEx.set(s.exerciseId, list);
      }
      for (const [exId, list] of byEx) {
        list.sort((a, b) => a.setIndex - b.setIndex);
        map.set(exId, list);
        needed.delete(exId);
      }
    }
    return map;
  }, [completedWorkouts, allSets, grouped]);

  const previousLabel = (exerciseId: number, position: number): string => {
    const prev = previousSetsByExercise.get(exerciseId)?.[position];
    if (!prev || prev.reps == null) return '–';
    if (prev.weight == null) return `BW × ${prev.reps}`;
    return `${round1(convertWeight(prev.weight, prev.unit, weightUnit))} ${weightUnit} × ${prev.reps}`;
  };

  const exerciseById = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);

  const trimmedQuery = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (trimmedQuery === '') return exercises.slice(0, 8);
    return exercises
      .filter((e) => e.name.toLowerCase().includes(trimmedQuery))
      .slice(0, 8);
  }, [exercises, trimmedQuery]);
  const exactMatch = exercises.some((e) => e.name.toLowerCase() === trimmedQuery);
  const addedExerciseIds = useMemo(() => new Set(grouped.map(([id]) => id)), [grouped]);

  const handleAddExercise = async (name: string) => {
    if (!activeWorkout || adding) return;
    setAdding(true);
    try {
      await dispatch(
        addExerciseToWorkoutAsync({ workoutId: activeWorkout.id, name: name.trim(), unit: weightUnit })
      );
      setQuery('');
    } finally {
      setAdding(false);
    }
  };

  const handleFinish = () => {
    if (!activeWorkout) return;
    const unfinished = activeSets.filter((s) => !s.completed);

    // Case 1: nothing added — finishing makes no sense, offer cancel or resume.
    if (grouped.length === 0) {
      Alert.alert('Empty Workout', 'No exercises added to this session.', [
        { text: 'Resume', style: 'cancel' },
        {
          text: 'Cancel Workout',
          style: 'destructive',
          onPress: async () => {
            await dispatch(discardWorkoutAsync({ workoutId: activeWorkout.id }));
            router.back();
          },
        },
      ]);
      return;
    }

    // Case 2: some sets aren't checked off — offer to discard them and finish.
    if (unfinished.length > 0) {
      const label = unfinished.length === 1 ? '1 set is' : `${unfinished.length} sets are`;
      Alert.alert(
        'Unfinished Sets',
        `${label} not completed. Discard them and finish?`,
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard & Finish',
            onPress: async () => {
              for (const s of unfinished) {
                await dispatch(removeSetAsync(s.id));
              }
              if (activeSets.length - unfinished.length === 0) {
                await dispatch(discardWorkoutAsync({ workoutId: activeWorkout.id }));
              } else {
                await dispatch(finishWorkoutAsync({ workout: activeWorkout }));
              }
              router.back();
            },
          },
        ]
      );
      return;
    }

    // Case 3: everything completed — plain finish/cancel confirm.
    Alert.alert('Finish Workout', 'Save this workout to history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Finish',
        onPress: async () => {
          await dispatch(finishWorkoutAsync({ workout: activeWorkout }));
          router.back();
        },
      },
    ]);
  };

  const handleDiscard = () => {
    if (!activeWorkout) return;
    Alert.alert('Cancel Workout', 'Delete this workout and all its sets?', [
      { text: 'Keep Training', style: 'cancel' },
      {
        text: 'Cancel Workout',
        style: 'destructive',
        onPress: async () => {
          await dispatch(discardWorkoutAsync({ workoutId: activeWorkout.id }));
          router.back();
        },
      },
    ]);
  };

  if (!activeWorkout) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.systemGroupedBackground }]}>
        <View style={styles.center}>
          <Text style={[styles.emptyTitle, { color: colors.label }]}>No active workout</Text>
          <Pressable
            style={styles.addButton}
            onPress={async () => {
              await dispatch(startWorkoutAsync());
            }}
          >
            <Text style={[styles.addButtonText, { color: colors.systemBlue }]}>
              Start an Empty Workout
            </Text>
          </Pressable>
          <Pressable onPress={() => router.back()} style={{ marginTop: 12 }}>
            <Text style={[styles.linkText, { color: colors.systemBlue }]}>Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const paused = activeWorkout.status === 'paused';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.systemGroupedBackground }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topBar}>
          <Pressable
            style={[styles.iconButton, { backgroundColor: colors.inputBackground }]}
            onPress={() =>
              paused
                ? dispatch(resumeWorkoutAsync({ workout: activeWorkout }))
                : dispatch(pauseWorkoutAsync({ workout: activeWorkout }))
            }
            accessibilityRole="button"
            accessibilityLabel={paused ? 'Resume workout' : 'Pause workout'}
          >
            <Text style={[styles.iconText, { color: colors.label }]}>{paused ? '▶' : '❚❚'}</Text>
          </Pressable>
          <Pressable
            style={styles.minimizeButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Minimize workout"
          >
            <Text style={[styles.minimizeText, { color: colors.secondaryLabel }]}>﹀</Text>
          </Pressable>
          <Pressable style={[styles.finishButton, { backgroundColor: green }]} onPress={handleFinish}>
            <Text style={[styles.finishButtonText, { color: colors.onAccent }]}>Finish</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.workoutTitle, { color: colors.label }]}>
            {getWorkoutName(activeWorkout.startedAt)}
          </Text>
          <Text style={[styles.workoutSub, { color: colors.secondaryLabel }]}>
            {activeWorkout.startedAt.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
          <Text style={[styles.workoutSub, { color: colors.secondaryLabel }]}>
            {formatElapsed(elapsed)}{paused ? ' · Paused' : ''}
          </Text>

          {grouped.map(([exerciseId, exSets]) => (
            <View
              key={exerciseId}
              style={[styles.exerciseCard, { backgroundColor: colors.cardBackground }]}
            >
              <View style={styles.exerciseHeader}>
                <Text style={[styles.exerciseName, { color: colors.systemBlue }]}>
                  {exerciseById.get(exerciseId)?.name ?? 'Unknown'}
                </Text>
                <Pressable
                  onPress={() =>
                    dispatch(removeExerciseFromWorkoutAsync({ workoutId: activeWorkout.id, exerciseId }))
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Remove exercise from workout"
                >
                  <Text style={[styles.removeExercise, { color: colors.destructive }]}>Remove</Text>
                </Pressable>
              </View>
              <View style={styles.columnHeader}>
                <Text
                  style={[
                    styles.columnText,
                    styles.setIndexBadge,
                    { color: colors.secondaryLabel },
                  ]}
                >
                  SET
                </Text>
                <Text
                  style={[
                    styles.columnText,
                    styles.previousHeader,
                    { color: colors.secondaryLabel },
                  ]}
                >
                  PREVIOUS
                </Text>
                <Text
                  style={[
                    styles.columnText,
                    styles.valueHeader,
                    { color: colors.secondaryLabel },
                  ]}
                >
                  {weightUnit.toUpperCase()}
                </Text>
                <Text
                  style={[
                    styles.columnText,
                    styles.valueHeader,
                    { color: colors.secondaryLabel },
                  ]}
                >
                  REPS
                </Text>
                <Text
                  style={[
                    styles.columnText,
                    styles.checkHeader,
                    { color: colors.secondaryLabel },
                  ]}
                >
                  ✓
                </Text>
              </View>
              {exSets.map((s, position) => (
                <SetRow
                  key={s.id}
                  set={s}
                  unit={weightUnit}
                  previous={previousLabel(exerciseId, position)}
                />
              ))}
              <Pressable
                style={[styles.addSetButton, { backgroundColor: colors.inputBackground }]}
                onPress={() =>
                  dispatch(
                    addSetAsync({
                      workoutId: activeWorkout.id,
                      exerciseId,
                      reps: null,
                      weight: null,
                      unit: weightUnit,
                    })
                  )
                }
              >
                <Text style={[styles.addSetText, { color: colors.label }]}>+ Add Set</Text>
              </Pressable>
            </View>
          ))}

          <Pressable
            style={styles.addButton}
            onPress={() => {
              setQuery('');
              setSearchVisible(true);
            }}
          >
            <Text style={[styles.addButtonText, { color: colors.systemBlue }]}>
              Add Exercises
            </Text>
          </Pressable>

          <Pressable style={styles.cancelButton} onPress={handleDiscard}>
            <Text style={[styles.cancelButtonText, { color: colors.destructive }]}>
              Cancel Workout
            </Text>
          </Pressable>
        </ScrollView>

        <Modal
          visible={searchVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setSearchVisible(false)}
        >
          <SafeAreaView style={[styles.modalSafe, { backgroundColor: colors.systemGroupedBackground }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.separator }]}>
              <Pressable onPress={() => setSearchVisible(false)}>
                <Text style={[styles.modalCancel, { color: colors.secondaryLabel }]}>Cancel</Text>
              </Pressable>
              <Text style={[styles.modalTitle, { color: colors.label }]}>Add Exercises</Text>
              <Pressable onPress={() => setSearchVisible(false)}>
                <Text style={[styles.modalDone, { color: colors.systemBlue }]}>Done</Text>
              </Pressable>
            </View>
            <View style={styles.modalBody}>
              <TextInput
                style={[
                  styles.searchInput,
                  { backgroundColor: colors.inputBackground, color: colors.label },
                ]}
                value={query}
                onChangeText={setQuery}
                placeholder="Search exercises…"
                placeholderTextColor={colors.secondaryLabel}
                returnKeyType="search"
              />
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {trimmedQuery !== '' && !exactMatch && (
                  <Pressable
                    style={[styles.resultRow, { borderBottomColor: colors.separator }]}
                    onPress={() => handleAddExercise(query)}
                  >
                    <Text style={[styles.resultText, { color: colors.label }]}>
                      Create “{query.trim()}”
                    </Text>
                  </Pressable>
                )}
                {filtered.map((e) => {
                  const added = addedExerciseIds.has(e.id);
                  return (
                    <Pressable
                      key={e.id}
                      style={[styles.resultRow, { borderBottomColor: colors.separator }]}
                      onPress={() => {
                        if (added) {
                          dispatch(
                            removeExerciseFromWorkoutAsync({ workoutId: activeWorkout.id, exerciseId: e.id })
                          );
                        } else {
                          handleAddExercise(e.name);
                        }
                      }}
                      disabled={adding}
                    >
                      <View style={styles.resultMain}>
                        <Text style={[styles.resultText, { color: colors.label }]}>{e.name}</Text>
                        {e.muscleGroup && (
                          <Text style={[styles.resultSub, { color: colors.secondaryLabel }]}>
                            {e.muscleGroup}
                          </Text>
                        )}
                      </View>
                      {added && <Text style={[styles.addedCheck, { color: green }]}>✓</Text>}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </SafeAreaView>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  linkText: { fontSize: 16 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  iconButton: {
    borderRadius: 10,
    width: 46,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 15, fontWeight: '700' },
  minimizeButton: { flex: 1, alignItems: 'flex-start', paddingVertical: 8 },
  minimizeText: { fontSize: 20, fontWeight: '600' },
  finishButton: {
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 22,
  },
  finishButtonText: { fontSize: 16, fontWeight: '700' },
  scroll: { padding: 16, gap: 10, paddingBottom: 60 },
  workoutTitle: { fontSize: 26, fontWeight: '700' },
  workoutSub: { fontSize: 15, fontVariant: ['tabular-nums'] },
  exerciseCard: { borderRadius: 12, padding: 12, gap: 2 },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  exerciseName: { fontSize: 17, fontWeight: '700', flex: 1 },
  removeExercise: { fontSize: 13, fontWeight: '600' },
  columnHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  columnText: { fontSize: 11, fontWeight: '600' },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 3 },
  setIndexBadge: { width: 30, alignItems: 'center' },
  setIndex: { fontSize: 14, fontVariant: ['tabular-nums'] },
  previous: { flex: 1.25, fontSize: 13, fontVariant: ['tabular-nums'] },
  previousHeader: { flex: 1.25 },
  valueHeader: { flex: 1, textAlign: 'center' },
  setInput: {
    flex: 1,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 8,
    fontSize: 16,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  checkCell: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkHeader: { width: 34, textAlign: 'center', fontSize: 13 },
  checkText: { fontSize: 16, fontWeight: '700' },
  addSetButton: {
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addSetText: { fontSize: 15, fontWeight: '600' },
  searchInput: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 16,
  },
  modalSafe: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  modalCancel: { fontSize: 16, minWidth: 64 },
  modalDone: { fontSize: 16, fontWeight: '700', minWidth: 64, textAlign: 'right' },
  modalBody: { flex: 1, padding: 16, gap: 8 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
  },
  resultMain: { flex: 1 },
  resultText: { fontSize: 16, fontWeight: '500' },
  resultSub: { fontSize: 13 },
  addedCheck: { fontSize: 16, fontWeight: '700' },
  addButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.12)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addButtonText: { fontSize: 16, fontWeight: '700' },
  cancelButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: { fontSize: 16, fontWeight: '700' },
});
