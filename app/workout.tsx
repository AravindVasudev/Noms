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
import { ExerciseArt } from '@/components/ui/exercise-art';
import {
  addExerciseToWorkoutAsync,
  addSetAsync,
  createExerciseAsync,
  deleteExerciseAsync,
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
import type { BodyPart, Exercise, WorkoutSet } from '@/lib/workout-store';
import { BODY_PARTS, formatExerciseRef, titleCaseVariation } from '@/lib/workout-store';

const compositeKey = (exerciseId: number, variation: string | null): string =>
  `${exerciseId}::${variation ?? ''}`;

const formatBodyPart = (b: string | null): string =>
  b == null || b === '' ? 'Other' : b.charAt(0).toUpperCase() + b.slice(1);

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

  const completedRowBackground =
    scheme === 'dark' ? 'rgba(48, 209, 88, 0.22)' : 'rgba(52, 199, 89, 0.18)';

  return (
    <View style={[styles.setRow, set.completed && { backgroundColor: completedRowBackground }]}>
      <Pressable
        onPress={confirmDeleteSet}
        style={[
          styles.setIndexBadge,
          !set.completed && { backgroundColor: colors.inputBackground, borderRadius: 8 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Delete set ${set.setIndex}`}
      >
        <Text style={[styles.setIndex, { color: set.completed ? colors.label : colors.secondaryLabel }]}>{set.setIndex}</Text>
      </Pressable>
      <Text style={[styles.previous, { color: colors.secondaryLabel }]} numberOfLines={1}>
        {previous}
      </Text>
      <TextInput
        style={[
          styles.setInput,
          set.completed
            ? { backgroundColor: 'transparent', color: colors.label }
            : { backgroundColor: colors.inputBackground, color: colors.label },
        ]}
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
        style={[
          styles.setInput,
          set.completed
            ? { backgroundColor: 'transparent', color: colors.label }
            : { backgroundColor: colors.inputBackground, color: colors.label },
        ]}
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
  const [bodyPartFilter, setBodyPartFilter] = useState<BodyPart | 'any'>('any');
  const [expandedExerciseId, setExpandedExerciseId] = useState<number | null>(null);
  const [pendingVariation, setPendingVariation] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createBodyPart, setCreateBodyPart] = useState<BodyPart>('other');
  const [createVariations, setCreateVariations] = useState<string[]>([]);
  const [createDefault, setCreateDefault] = useState<string | null>(null);
  const [newVariationInput, setNewVariationInput] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const elapsed = useWorkoutElapsed(activeWorkout);

  const activeSets = useMemo(
    () => (activeWorkout ? allSets.filter((s) => s.workoutId === activeWorkout.id) : []),
    [allSets, activeWorkout]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, { exerciseId: number; variation: string | null; sets: WorkoutSet[] }>();
    for (const s of activeSets) {
      const key = compositeKey(s.exerciseId, s.variation ?? null);
      const entry = map.get(key);
      if (entry) {
        entry.sets.push(s);
      } else {
        map.set(key, { exerciseId: s.exerciseId, variation: s.variation ?? null, sets: [s] });
      }
    }
    return [...map.values()].sort((a, b) => a.sets[0].id - b.sets[0].id);
  }, [activeSets]);

  // Previous performance per exercise+variation: completed sets from the most
  // recent completed workout containing that composite, aligned by set order.
  const previousSetsByRef = useMemo(() => {
    const map = new Map<string, WorkoutSet[]>();
    const needed = new Set(grouped.map((g) => compositeKey(g.exerciseId, g.variation)));
    if (needed.size === 0) return map;
    for (const w of completedWorkouts) {
      if (needed.size === 0) break;
      const byRef = new Map<string, WorkoutSet[]>();
      for (const s of allSets) {
        if (s.workoutId !== w.id || !s.completed) continue;
        const key = compositeKey(s.exerciseId, s.variation ?? null);
        if (!needed.has(key) || map.has(key)) continue;
        const list = byRef.get(key) ?? [];
        list.push(s);
        byRef.set(key, list);
      }
      for (const [key, list] of byRef) {
        list.sort((a, b) => a.setIndex - b.setIndex);
        map.set(key, list);
        needed.delete(key);
      }
    }
    return map;
  }, [completedWorkouts, allSets, grouped]);

  const previousLabel = (exerciseId: number, variation: string | null, position: number): string => {
    const prev = previousSetsByRef.get(compositeKey(exerciseId, variation))?.[position];
    if (!prev || prev.reps == null) return '–';
    if (prev.weight == null) return `BW × ${prev.reps}`;
    return `${round1(convertWeight(prev.weight, prev.unit, weightUnit))} ${weightUnit} × ${prev.reps}`;
  };

  const exerciseById = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);

  const trimmedQuery = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    const q = trimmedQuery;
    return exercises.filter((e) => {
      if (bodyPartFilter !== 'any' && (e.bodyPart ?? 'other') !== bodyPartFilter) return false;
      if (q === '') return true;
      return e.name.toLowerCase().includes(q);
    });
  }, [exercises, trimmedQuery, bodyPartFilter]);
  const exactMatch = exercises.some((e) => e.name.toLowerCase() === trimmedQuery);
  const addedRefKeys = useMemo(() => new Set(grouped.map((g) => compositeKey(g.exerciseId, g.variation))), [grouped]);

  const handleAddExercise = async (exercise: Exercise, variation?: string | null) => {
    if (!activeWorkout || adding) return;
    setAdding(true);
    try {
      await dispatch(
        addExerciseToWorkoutAsync({
          workoutId: activeWorkout.id,
          exerciseId: exercise.id,
          variation: variation !== undefined ? variation : (exercise.defaultVariation ?? null),
          unit: weightUnit,
        })
      );
      // Close the modal on add — one add per open.
      setExpandedExerciseId(null);
      setPendingVariation(null);
      setSearchVisible(false);
    } finally {
      setAdding(false);
    }
  };

  const openSearch = () => {
    setQuery('');
    setBodyPartFilter('any');
    setExpandedExerciseId(null);
    setPendingVariation(null);
    setSearchVisible(true);
  };

  const firstUnaddedVariation = (e: Exercise): string | null => {
    for (const v of e.variations) {
      if (!addedRefKeys.has(compositeKey(e.id, v))) return v;
    }
    return null;
  };

  // Add modal only lists unadded refs: no-variation exercises vanish once
  // added, and added variations are hidden from the pill row.
  const visibleExercises = useMemo(
    () =>
      filtered.filter((e) => {
        if (e.variations.length === 0) return !addedRefKeys.has(compositeKey(e.id, null));
        return e.variations.some((v) => !addedRefKeys.has(compositeKey(e.id, v)));
      }),
    [filtered, addedRefKeys]
  );

  const openCreate = (prefill: string) => {
    setCreateName(prefill.trim());
    setCreateBodyPart(bodyPartFilter !== 'any' ? bodyPartFilter : 'other');
    setCreateVariations([]);
    setCreateDefault(null);
    setNewVariationInput('');
    setCreateError(null);
    setCreateVisible(true);
  };

  const handleCreateExercise = async () => {
    if (!activeWorkout || adding) return;
    const name = createName.trim();
    if (!name) {
      setCreateError('Name is required.');
      return;
    }
    if (exercises.some((e) => e.name.toLowerCase() === name.toLowerCase())) {
      setCreateError('An exercise with this name already exists.');
      return;
    }
    setAdding(true);
    setCreateError(null);
    try {
      const created = await dispatch(
        createExerciseAsync({
          name,
          bodyPart: createBodyPart,
          variations: createVariations,
          defaultVariation: createVariations.length === 0 ? null : (createDefault ?? createVariations[0]),
        })
      ).unwrap();
      await dispatch(
        addExerciseToWorkoutAsync({
          workoutId: activeWorkout.id,
          exerciseId: created.id,
          variation: created.defaultVariation ?? null,
          unit: weightUnit,
        })
      );
      setCreateVisible(false);
      setSearchVisible(false);
      setQuery('');
      setExpandedExerciseId(null);
      setPendingVariation(null);
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Could not create exercise.');
    } finally {
      setAdding(false);
    }
  };

  const handleLongPressExercise = (e: Exercise) => {
    if (!e.isCustom) return;
    Alert.alert(`Delete “${e.name}”?`, 'This removes it from the catalog, including its history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (expandedExerciseId === e.id) {
            setExpandedExerciseId(null);
            setPendingVariation(null);
          }
          await dispatch(deleteExerciseAsync(e.id));
        },
      },
    ]);
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

          {grouped.map((group) => (
            <View
              key={compositeKey(group.exerciseId, group.variation)}
              style={[styles.exerciseCard, { backgroundColor: colors.cardBackground }]}
            >
              <View style={styles.exerciseHeader}>
                <View style={styles.exerciseTitleWrap}>
                  <Text style={[styles.exerciseName, { color: colors.systemBlue }]}>
                    {formatExerciseRef(exerciseById.get(group.exerciseId)?.name ?? 'Unknown', group.variation)}
                  </Text>
                </View>
                <Pressable
                  onPress={() =>
                    dispatch(removeExerciseFromWorkoutAsync({ workoutId: activeWorkout.id, exerciseId: group.exerciseId, variation: group.variation }))
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
              {group.sets.map((s, position) => (
                <SetRow
                  key={s.id}
                  set={s}
                  unit={weightUnit}
                  previous={previousLabel(group.exerciseId, group.variation, position)}
                />
              ))}
              <Pressable
                style={[styles.addSetButton, { backgroundColor: colors.inputBackground }]}
                onPress={() =>
                  dispatch(
                    addSetAsync({
                      workoutId: activeWorkout.id,
                      exerciseId: group.exerciseId,
                      reps: null,
                      weight: null,
                      unit: weightUnit,
                      variation: group.variation,
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
            onPress={openSearch}
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
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipScroll}
                contentContainerStyle={styles.chipRow}
                keyboardShouldPersistTaps="handled"
              >
                {(['any', ...BODY_PARTS] as const).map((b) => {
                  const selected = bodyPartFilter === b;
                  return (
                    <Pressable
                      key={b}
                      onPress={() => {
                        setBodyPartFilter(b);
                        setExpandedExerciseId(null);
                      }}
                      style={[
                        styles.chip,
                        { backgroundColor: colors.inputBackground },
                        selected && { backgroundColor: colors.systemBlue },
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`Filter by ${b === 'any' ? 'any body part' : b}`}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: colors.secondaryLabel },
                          selected && { color: colors.onAccent },
                        ]}
                      >
                        {b === 'any' ? 'Any' : formatBodyPart(b)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <ScrollView
                style={styles.resultList}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {trimmedQuery !== '' && !exactMatch && (
                  <Pressable
                    style={[styles.resultRow, { borderBottomColor: colors.separator }]}
                    onPress={() => openCreate(query)}
                  >
                    <Text style={[styles.resultText, { color: colors.label }]}>
                      Create “{query.trim()}”
                    </Text>
                  </Pressable>
                )}
                {visibleExercises.map((e) => {
                  const defaultVariation = e.defaultVariation ?? null;
                  const hasVariations = e.variations.length > 0;
                  const expanded = expandedExerciseId === e.id;
                  const unaddedVariations = e.variations.filter(
                    (v) => !addedRefKeys.has(compositeKey(e.id, v))
                  );
                  const pending = expanded
                    ? (pendingVariation ?? firstUnaddedVariation(e) ?? defaultVariation)
                    : defaultVariation;
                  return (
                    <View key={e.id} style={[styles.resultRowWrap, { borderBottomColor: colors.separator }]}>
                      <Pressable
                        style={styles.resultRow}
                        onPress={() => {
                          if (!hasVariations) {
                            handleAddExercise(e, null);
                          } else if (expanded) {
                            setExpandedExerciseId(null);
                          } else {
                            setExpandedExerciseId(e.id);
                            setPendingVariation(firstUnaddedVariation(e) ?? e.defaultVariation ?? null);
                          }
                        }}
                        onLongPress={() => handleLongPressExercise(e)}
                        delayLongPress={500}
                        accessibilityHint={e.isCustom ? 'Long press to delete this custom exercise' : undefined}
                        disabled={adding}
                      >
                        <View style={[styles.thumb, { backgroundColor: colors.inputBackground }]}>
                          <ExerciseArt
                            imageKey={e.imageKey}
                            size={40}
                            stroke={colors.secondaryLabel}
                            highlight={colors.systemBlue}
                          />
                        </View>
                        <View style={styles.resultMain}>
                          <Text style={[styles.resultText, { color: colors.label }]}>{e.name}</Text>
                          <Text style={[styles.resultSub, { color: colors.secondaryLabel }]}>
                            {formatBodyPart(e.bodyPart)}
                          </Text>
                        </View>
                        {hasVariations && (
                          <Text style={[styles.expandHint, { color: colors.secondaryLabel }]}>{expanded ? '▾' : '▸'}</Text>
                        )}
                      </Pressable>
                      {expanded && hasVariations && (
                        <>
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.pillScroll}
                            contentContainerStyle={styles.pillRowScroll}
                            keyboardShouldPersistTaps="handled"
                          >
                            {unaddedVariations.map((v) => {
                              const isPending = (pending ?? null) === v;
                              return (
                                <Pressable
                                  key={v}
                                  onPress={() => setPendingVariation(v)}
                                  disabled={adding}
                                  style={[
                                    styles.pill,
                                    { backgroundColor: colors.inputBackground },
                                    isPending && { borderColor: colors.systemBlue, borderWidth: 1 },
                                  ]}
                                  accessibilityRole="radio"
                                  accessibilityState={{ selected: isPending }}
                                  accessibilityLabel={`Select ${e.name} ${v}`}
                                >
                                  <Text
                                    style={[
                                      styles.pillText,
                                      { color: colors.secondaryLabel },
                                      isPending && { color: colors.label },
                                    ]}
                                  >
                                    {titleCaseVariation(v)}
                                  </Text>
                                </Pressable>
                              );
                            })}
                          </ScrollView>
                          <Pressable
                            style={[styles.variationAddButton, { backgroundColor: colors.systemBlue }]}
                            onPress={() => {
                              handleAddExercise(e, pending ?? null);
                              setExpandedExerciseId(null);
                            }}
                            disabled={adding}
                          >
                            <Text style={[styles.variationAddText, { color: colors.onAccent }]}>
                              {`Add ${formatExerciseRef(e.name, pending ?? null)}`}
                            </Text>
                          </Pressable>
                        </>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </SafeAreaView>
        </Modal>

        <Modal
          visible={createVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setCreateVisible(false)}
        >
          <SafeAreaView style={[styles.modalSafe, { backgroundColor: colors.systemGroupedBackground }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.separator }]}>
              <Pressable onPress={() => setCreateVisible(false)}>
                <Text style={[styles.modalCancel, { color: colors.secondaryLabel }]}>Cancel</Text>
              </Pressable>
              <Text style={[styles.modalTitle, { color: colors.label }]}>New Exercise</Text>
              <Pressable onPress={() => setCreateVisible(false)}>
                <Text style={[styles.modalDone, { color: colors.systemBlue }]}>Done</Text>
              </Pressable>
            </View>
            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={{ gap: 4, paddingBottom: 32 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.createLabel, { color: colors.label }]}>Name</Text>
              <TextInput
                style={[styles.searchInput, { backgroundColor: colors.inputBackground, color: colors.label }]}
                value={createName}
                onChangeText={setCreateName}
                placeholder="Exercise name"
                placeholderTextColor={colors.secondaryLabel}
                returnKeyType="done"
              />
              <Text style={[styles.createLabel, { color: colors.label }]}>Body part</Text>
              <View style={styles.pillRow}>
                {BODY_PARTS.map((b) => (
                  <Pressable
                    key={b}
                    onPress={() => setCreateBodyPart(b)}
                    style={[
                      styles.pill,
                      { backgroundColor: colors.inputBackground },
                      createBodyPart === b && { backgroundColor: colors.systemBlue },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: createBodyPart === b }}
                    accessibilityLabel={`Body part ${b}`}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        { color: colors.secondaryLabel },
                        createBodyPart === b && { color: colors.onAccent },
                      ]}
                    >
                      {formatBodyPart(b)}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={[styles.createLabel, { color: colors.label }]}>Variations (optional)</Text>
              {createVariations.map((v) => (
                <View key={v.toLowerCase()} style={styles.variationRow}>
                  <Pressable onPress={() => setCreateDefault(v)} accessibilityRole="button">
                    <Text style={[styles.variationName, { color: createDefault === v || (createDefault == null && createVariations[0] === v) ? colors.systemBlue : colors.label }]}>
                      {(createDefault === v || (createDefault == null && createVariations[0] === v) ? '● ' : '○ ') + titleCaseVariation(v)}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      const next = createVariations.filter((x) => x !== v);
                      setCreateVariations(next);
                      if (createDefault === v) setCreateDefault(next[0] ?? null);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove variation ${v}`}
                  >
                    <Text style={[styles.variationRemove, { color: colors.destructive }]}>Remove</Text>
                  </Pressable>
                </View>
              ))}
              <View style={styles.createInputRow}>
                <TextInput
                  style={[styles.searchInput, { flex: 1, backgroundColor: colors.inputBackground, color: colors.label }]}
                  value={newVariationInput}
                  onChangeText={setNewVariationInput}
                  placeholder="Add variation (e.g. dumbbells)"
                  placeholderTextColor={colors.secondaryLabel}
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    const t = newVariationInput.trim();
                    if (t && !createVariations.some((x) => x.toLowerCase() === t.toLowerCase())) {
                      setCreateVariations([...createVariations, t]);
                      if (createVariations.length === 0) setCreateDefault(t);
                    }
                    setNewVariationInput('');
                  }}
                />
                <Pressable
                  style={[styles.createAddButton, { backgroundColor: colors.inputBackground }]}
                  onPress={() => {
                    const t = newVariationInput.trim();
                    if (t && !createVariations.some((x) => x.toLowerCase() === t.toLowerCase())) {
                      setCreateVariations([...createVariations, t]);
                      if (createVariations.length === 0) setCreateDefault(t);
                    }
                    setNewVariationInput('');
                  }}
                >
                  <Text style={[styles.createAddText, { color: colors.systemBlue }]}>Add</Text>
                </Pressable>
              </View>
              {createError && <Text style={[styles.createError, { color: colors.destructive }]}>{createError}</Text>}
              <Pressable
                style={[styles.createSaveButton, { backgroundColor: green }]}
                onPress={handleCreateExercise}
                disabled={adding}
              >
                <Text style={[styles.createSaveText, { color: colors.onAccent }]}>Create & Add</Text>
              </Pressable>
            </ScrollView>
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
  exerciseTitleWrap: { flex: 1 },
  exerciseName: { fontSize: 17, fontWeight: '700' },
  removeExercise: { fontSize: 13, fontWeight: '600' },
  columnHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  columnText: { fontSize: 11, fontWeight: '600' },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 5, paddingHorizontal: 4, borderRadius: 8 },
  setIndexBadge: { width: 30, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
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
  },
  resultRowWrap: {
    borderBottomWidth: 1,
    paddingBottom: 4,
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  expandHint: { fontSize: 14, marginLeft: 6 },
  chipRow: { flexDirection: 'row', gap: 8, paddingVertical: 4, paddingRight: 16, alignItems: 'center' },
  chipScroll: { flexGrow: 0, flexShrink: 0 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 4 },
  chip: { borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14, flexShrink: 0 },
  chipText: { fontSize: 14, fontWeight: '500' },
  resultList: { flex: 1 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 14, paddingVertical: 8 },
  pillScroll: { flexGrow: 0, flexShrink: 0 },
  pillRowScroll: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center' },
  variationAddButton: { borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginHorizontal: 14, marginBottom: 8 },
  variationAddText: { fontSize: 15, fontWeight: '700' },
  pill: { borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12 },
  pillText: { fontSize: 14, fontWeight: '500' },
  createLabel: { fontSize: 15, fontWeight: '600', marginTop: 8 },
  createError: { fontSize: 14 },
  variationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  variationName: { fontSize: 16 },
  variationRemove: { fontSize: 14, fontWeight: '600' },
  createInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  createAddButton: { borderRadius: 10, paddingVertical: 11, paddingHorizontal: 16 },
  createAddText: { fontSize: 15, fontWeight: '700' },
  createSaveButton: { borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 12 },
  createSaveText: { fontSize: 16, fontWeight: '700' },
  resultMain: { flex: 1 },
  resultText: { fontSize: 16, fontWeight: '500' },
  resultSub: { fontSize: 13 },
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
