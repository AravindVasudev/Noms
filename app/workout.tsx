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

const BLUE = '#007AFF';
const GREEN = '#34C759';
const RED = '#ff3b30';

function convertWeight(weight: number, from: WeightUnit, to: WeightUnit): number {
  if (from === to) return weight;
  return from === 'kg' ? weight * KG_TO_LB : weight / KG_TO_LB;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

function SetRow({ set, unit, previous }: { set: WorkoutSet; unit: string; previous: string }) {
  const dispatch = useAppDispatch();
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
        <Text style={styles.setIndex}>{set.setIndex}</Text>
      </Pressable>
      <Text style={styles.previous} numberOfLines={1}>
        {previous}
      </Text>
      <TextInput
        style={styles.setInput}
        value={weight}
        onChangeText={setWeight}
        onBlur={commitWeight}
        placeholder="–"
        placeholderTextColor="#aeaeb2"
        keyboardType="decimal-pad"
        returnKeyType="done"
        accessibilityLabel={`Set ${set.setIndex} weight in ${unit}`}
      />
      <TextInput
        style={styles.setInput}
        value={reps}
        onChangeText={setReps}
        onBlur={commitReps}
        placeholder="–"
        placeholderTextColor="#aeaeb2"
        keyboardType="number-pad"
        returnKeyType="done"
        accessibilityLabel={`Set ${set.setIndex} reps`}
      />
      <Pressable
        onPress={toggleCompleted}
        style={[styles.checkCell, set.completed && styles.checkCellDone]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: set.completed }}
        accessibilityLabel={`Mark set ${set.setIndex} complete`}
      >
        <Text style={[styles.checkText, set.completed && styles.checkTextDone]}>✓</Text>
      </Pressable>
    </View>
  );
}

export default function WorkoutScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
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
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No active workout</Text>
          <Pressable
            style={styles.addButton}
            onPress={async () => {
              await dispatch(startWorkoutAsync());
            }}
          >
            <Text style={styles.addButtonText}>Start an Empty Workout</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} style={{ marginTop: 12 }}>
            <Text style={styles.linkText}>Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const paused = activeWorkout.status === 'paused';

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topBar}>
          <Pressable
            style={styles.iconButton}
            onPress={() =>
              paused
                ? dispatch(resumeWorkoutAsync({ workout: activeWorkout }))
                : dispatch(pauseWorkoutAsync({ workout: activeWorkout }))
            }
            accessibilityRole="button"
            accessibilityLabel={paused ? 'Resume workout' : 'Pause workout'}
          >
            <Text style={styles.iconText}>{paused ? '▶' : '❚❚'}</Text>
          </Pressable>
          <Pressable
            style={styles.minimizeButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Minimize workout"
          >
            <Text style={styles.minimizeText}>﹀</Text>
          </Pressable>
          <Pressable style={styles.finishButton} onPress={handleFinish}>
            <Text style={styles.finishButtonText}>Finish</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.workoutTitle}>{getWorkoutName(activeWorkout.startedAt)}</Text>
          <Text style={styles.workoutSub}>
            {activeWorkout.startedAt.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
          <Text style={styles.workoutSub}>
            {formatElapsed(elapsed)}{paused ? ' · Paused' : ''}
          </Text>

          {grouped.map(([exerciseId, exSets]) => (
            <View key={exerciseId} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseName}>
                  {exerciseById.get(exerciseId)?.name ?? 'Unknown'}
                </Text>
                <Pressable
                  onPress={() =>
                    dispatch(removeExerciseFromWorkoutAsync({ workoutId: activeWorkout.id, exerciseId }))
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Remove exercise from workout"
                >
                  <Text style={styles.removeExercise}>Remove</Text>
                </Pressable>
              </View>
              <View style={styles.columnHeader}>
                <Text style={[styles.columnText, styles.setIndexBadge]}>SET</Text>
                <Text style={[styles.columnText, styles.previousHeader]}>PREVIOUS</Text>
                <Text style={[styles.columnText, styles.valueHeader]}>{weightUnit.toUpperCase()}</Text>
                <Text style={[styles.columnText, styles.valueHeader]}>REPS</Text>
                <Text style={[styles.columnText, styles.checkHeader]}>✓</Text>
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
                style={styles.addSetButton}
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
                <Text style={styles.addSetText}>+ Add Set</Text>
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
            <Text style={styles.addButtonText}>Add Exercises</Text>
          </Pressable>

          <Pressable style={styles.cancelButton} onPress={handleDiscard}>
            <Text style={styles.cancelButtonText}>Cancel Workout</Text>
          </Pressable>
        </ScrollView>

        <Modal
          visible={searchVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setSearchVisible(false)}
        >
          <SafeAreaView style={styles.modalSafe}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setSearchVisible(false)}>
                <Text style={styles.modalCancel}>Cancel</Text>
              </Pressable>
              <Text style={styles.modalTitle}>Add Exercises</Text>
              <Pressable onPress={() => setSearchVisible(false)}>
                <Text style={styles.modalDone}>Done</Text>
              </Pressable>
            </View>
            <View style={styles.modalBody}>
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Search exercises…"
                placeholderTextColor="#aeaeb2"
                returnKeyType="search"
              />
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {trimmedQuery !== '' && !exactMatch && (
                  <Pressable style={styles.resultRow} onPress={() => handleAddExercise(query)}>
                    <Text style={styles.resultText}>Create “{query.trim()}”</Text>
                  </Pressable>
                )}
                {filtered.map((e) => {
                  const added = addedExerciseIds.has(e.id);
                  return (
                    <Pressable
                      key={e.id}
                      style={styles.resultRow}
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
                        <Text style={styles.resultText}>{e.name}</Text>
                        {e.muscleGroup && <Text style={styles.resultSub}>{e.muscleGroup}</Text>}
                      </View>
                      {added && <Text style={styles.addedCheck}>✓</Text>}
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
  safeArea: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#000' },
  linkText: { color: BLUE, fontSize: 16 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  iconButton: {
    backgroundColor: '#f0f0f3',
    borderRadius: 10,
    width: 46,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { color: '#000', fontSize: 15, fontWeight: '700' },
  minimizeButton: { flex: 1, alignItems: 'flex-start', paddingVertical: 8 },
  minimizeText: { color: '#8e8e93', fontSize: 20, fontWeight: '600' },
  finishButton: {
    backgroundColor: GREEN,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 22,
  },
  finishButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  scroll: { padding: 16, gap: 10, paddingBottom: 60 },
  workoutTitle: { fontSize: 26, fontWeight: '700', color: '#000' },
  workoutSub: { fontSize: 15, color: '#636366', fontVariant: ['tabular-nums'] },
  exerciseCard: { backgroundColor: '#f6f6f8', borderRadius: 12, padding: 12, gap: 2 },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  exerciseName: { fontSize: 17, fontWeight: '700', color: BLUE, flex: 1 },
  removeExercise: { color: RED, fontSize: 13, fontWeight: '600' },
  columnHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  columnText: { fontSize: 11, fontWeight: '600', color: '#8e8e93' },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 3 },
  setIndexBadge: { width: 30, alignItems: 'center' },
  setIndex: { fontSize: 14, color: '#636366', fontVariant: ['tabular-nums'] },
  previous: { flex: 1.25, fontSize: 13, color: '#636366', fontVariant: ['tabular-nums'] },
  previousHeader: { flex: 1.25 },
  valueHeader: { flex: 1, textAlign: 'center' },
  setInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 8,
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  checkCell: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#e9e9ee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkHeader: { width: 34, textAlign: 'center', fontSize: 13 },
  checkCellDone: { backgroundColor: GREEN },
  checkText: { fontSize: 16, fontWeight: '700', color: '#aeaeb2' },
  checkTextDone: { color: '#fff' },
  addSetButton: {
    backgroundColor: '#e9e9ee',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addSetText: { color: '#000', fontSize: 15, fontWeight: '600' },
  searchInput: {
    backgroundColor: '#f0f0f3',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 16,
    color: '#000',
  },
  modalSafe: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f3',
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#000' },
  modalCancel: { fontSize: 16, color: '#636366', minWidth: 64 },
  modalDone: { fontSize: 16, fontWeight: '700', color: BLUE, minWidth: 64, textAlign: 'right' },
  modalBody: { flex: 1, padding: 16, gap: 8 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#e9e9ee',
  },
  resultMain: { flex: 1 },
  resultText: { fontSize: 16, fontWeight: '500', color: '#000' },
  resultSub: { fontSize: 13, color: '#636366' },
  addedCheck: { fontSize: 16, fontWeight: '700', color: GREEN },
  addButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.12)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addButtonText: { color: BLUE, fontSize: 16, fontWeight: '700' },
  cancelButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: { color: RED, fontSize: 16, fontWeight: '700' },
});
