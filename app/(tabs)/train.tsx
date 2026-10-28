import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppDispatch, useAppSelector } from '@/lib/store';
import {
  deleteWorkoutAsync,
  startWorkoutAsync,
} from '@/lib/trainingSlice';
import { KG_TO_LB, WeightUnit } from '@/lib/weight';
import { formatElapsed, getWorkoutElapsedSeconds, getWorkoutName } from '@/lib/workout-time';
import type { Workout } from '@/lib/workout-store';

function convertWeight(weight: number, from: WeightUnit, to: WeightUnit): number {
  if (from === to) return weight;
  return from === 'kg' ? weight * KG_TO_LB : weight / KG_TO_LB;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export default function Train() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { exercises, workouts, sets, activeWorkout, weightUnit, initialized } = useAppSelector(
    (state) => state.training
  );
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<number | null>(null);

  const exerciseById = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);

  const loggedSetsByWorkout = useMemo(() => {
    const map = new Map<number, typeof sets>();
    for (const w of workouts) {
      map.set(
        w.id,
        sets.filter((s) => s.workoutId === w.id && s.completed && (s.reps != null || s.weight != null))
      );
    }
    return map;
  }, [workouts, sets]);

  const workoutStats = useMemo(() => {
    const stats = new Map<number, { exerciseCount: number; volume: number }>();
    for (const w of workouts) {
      const wSets = loggedSetsByWorkout.get(w.id) ?? [];
      const volume = wSets.reduce((sum, s) => {
        if (s.reps == null || s.weight == null) return sum;
        return sum + s.reps * convertWeight(s.weight, s.unit, weightUnit);
      }, 0);
      stats.set(w.id, {
        exerciseCount: new Set(wSets.map((s) => s.exerciseId)).size,
        volume: round1(volume),
      });
    }
    return stats;
  }, [workouts, loggedSetsByWorkout, weightUnit]);

  const handleStart = async () => {
    await dispatch(startWorkoutAsync());
    router.push('/workout');
  };

  const handleDeleteWorkout = (workout: Workout) => {
    Alert.alert('Delete Workout', 'Delete this workout and all its sets?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => dispatch(deleteWorkoutAsync(workout.id)),
      },
    ]);
  };

  if (!initialized) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Start Workout</Text>
        </View>

        <Text style={styles.sectionLabel}>Quick Start</Text>
        {activeWorkout ? (
          <Pressable style={styles.resumeButton} onPress={() => router.push('/workout')}>
            <Text style={styles.resumeButtonText}>
              Resume Workout{activeWorkout.status === 'paused' ? ' (Paused)' : ''}
            </Text>
          </Pressable>
        ) : (
          <Pressable style={styles.startButton} onPress={handleStart}>
            <Text style={styles.startButtonText}>Start an Empty Workout</Text>
          </Pressable>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>History</Text>
          {workouts.length === 0 ? (
            <Text style={styles.emptyText}>No workouts yet. Start your first one above.</Text>
          ) : (
            workouts.map((w) => {
              const stats = workoutStats.get(w.id);
              const expanded = expandedWorkoutId === w.id;
              const grouped = new Map<number, NonNullable<ReturnType<typeof loggedSetsByWorkout.get>>>();
              for (const s of loggedSetsByWorkout.get(w.id) ?? []) {
                const list = grouped.get(s.exerciseId) ?? [];
                list.push(s);
                grouped.set(s.exerciseId, list);
              }
              return (
                <View key={w.id} style={styles.card}>
                  <Pressable
                    onPress={() => setExpandedWorkoutId(expanded ? null : w.id)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.cardTitle}>{getWorkoutName(w.startedAt)}</Text>
                    <Text style={styles.cardSub}>
                      {w.startedAt.toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                      {' · '}
                      {formatElapsed(getWorkoutElapsedSeconds(w, w.endedAt?.getTime() ?? Date.now()))}
                    </Text>
                    <Text style={styles.cardMeta}>
                      {stats?.exerciseCount ?? 0} {(stats?.exerciseCount ?? 0) === 1 ? 'exercise' : 'exercises'}
                      {' · '}
                      {stats?.volume ?? 0} {weightUnit}
                    </Text>
                  </Pressable>
                  {expanded && (
                    <View style={styles.detail}>
                      {[...grouped.entries()].map(([exerciseId, exSets]) => (
                        <View key={exerciseId} style={styles.detailGroup}>
                          <Text style={styles.detailExercise}>
                            {exerciseById.get(exerciseId)?.name ?? 'Unknown'}
                          </Text>
                          {exSets.map((s) => (
                            <Text key={s.id} style={styles.detailSet}>
                              {s.weight == null
                                ? 'Bodyweight'
                                : `${round1(convertWeight(s.weight, s.unit, weightUnit))} ${weightUnit}`}
                              {' × '}
                              {s.reps == null ? '–' : s.reps}
                            </Text>
                          ))}
                        </View>
                      ))}
                      <Pressable onPress={() => handleDeleteWorkout(w)}>
                        <Text style={styles.deleteText}>Delete workout</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
        <Text style={styles.hint}>Charts live in Insights — enable Training graphs under Customize Insights.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const BLUE = '#007AFF';

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 16, gap: 10, paddingBottom: 120 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  title: { fontSize: 26, fontWeight: '700', color: '#000' },
  sectionLabel: { fontSize: 17, fontWeight: '700', color: '#000', marginTop: 6 },
  section: { gap: 8 },
  startButton: {
    backgroundColor: BLUE,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  startButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resumeButton: {
    backgroundColor: '#f0f7ff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BLUE,
  },
  resumeButtonText: { color: BLUE, fontSize: 16, fontWeight: '700' },
  card: {
    backgroundColor: '#f6f6f8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#000' },
  cardSub: { fontSize: 14, color: '#636366', marginTop: 2 },
  cardMeta: { fontSize: 14, color: '#636366', marginTop: 4, fontVariant: ['tabular-nums'] },
  detail: { marginTop: 8, gap: 8, borderTopWidth: 1, borderTopColor: '#e5e5ea', paddingTop: 8 },
  detailGroup: { gap: 2 },
  detailExercise: { fontSize: 15, fontWeight: '600', color: '#000' },
  detailSet: { fontSize: 14, color: '#3a3a3c', fontVariant: ['tabular-nums'] },
  deleteText: { color: '#ff3b30', fontSize: 14, fontWeight: '600', marginTop: 4 },
  emptyText: { color: '#888', fontSize: 15 },
  hint: { color: '#8e8e93', fontSize: 13, textAlign: 'center' },
});
