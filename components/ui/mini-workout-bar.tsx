import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useWorkoutElapsed } from '@/hooks/use-workout-elapsed';
import { pauseWorkoutAsync, resumeWorkoutAsync } from '@/lib/trainingSlice';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { formatElapsed } from '@/lib/workout-time';

/**
 * Floating mini-player for the in-progress workout. Rendered from the root
 * layout so it persists across Food/Insights/Settings tabs. Hidden on the
 * full workout screen itself.
 */
export function MiniWorkoutBar() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const activeWorkout = useAppSelector((state) => state.training.activeWorkout);
  const allSets = useAppSelector((state) => state.training.sets);
  const activeSets = React.useMemo(
    () => (activeWorkout ? allSets.filter((s) => s.workoutId === activeWorkout.id) : []),
    [allSets, activeWorkout]
  );
  const elapsed = useWorkoutElapsed(activeWorkout);

  if (!activeWorkout) return null;
  if (pathname === '/workout') return null;

  const paused = activeWorkout.status === 'paused';
  const exerciseCount = new Set(activeSets.map((s) => s.exerciseId)).size;

  const togglePause = () => {
    if (paused) {
      dispatch(resumeWorkoutAsync({ workout: activeWorkout }));
    } else {
      dispatch(pauseWorkoutAsync({ workout: activeWorkout }));
    }
  };

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={styles.bar}>
        <Pressable
          style={styles.main}
          onPress={() => router.push('/workout')}
          accessibilityRole="button"
        >
          <View style={[styles.dot, paused && styles.dotPaused]} />
          <View>
            <Text style={styles.timer}>
              {formatElapsed(elapsed)}{paused ? ' · Paused' : ''}
            </Text>
            <Text style={styles.subtitle}>
              {exerciseCount === 1 ? '1 exercise' : `${exerciseCount} exercises`} · tap to resume
            </Text>
          </View>
        </Pressable>
        <Pressable
          onPress={togglePause}
          style={({ pressed }) => [styles.pauseButton, pressed && styles.pauseButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel={paused ? 'Resume workout' : 'Pause workout'}
        >
          <Text style={styles.pauseText}>{paused ? '▶' : '❚❚'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 96,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#34C759',
  },
  dotPaused: {
    backgroundColor: '#FFCC00',
  },
  timer: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  subtitle: {
    color: '#636366',
    fontSize: 12,
  },
  pauseButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pauseButtonPressed: {
    opacity: 0.6,
  },
  pauseText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default MiniWorkoutBar;
