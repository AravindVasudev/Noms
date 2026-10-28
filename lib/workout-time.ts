import type { Workout } from './workout-store';

/** Wall-clock elapsed seconds, excluding paused time. Recompute on render — never accumulate. */
export function getWorkoutElapsedSeconds(workout: Workout, now: number = Date.now()): number {
  const end = workout.status === 'completed' && workout.endedAt
    ? workout.endedAt.getTime()
    : now;
  let elapsed = Math.floor((end - workout.startedAt.getTime()) / 1000);
  elapsed -= workout.pausedTotalSeconds;
  if (workout.status === 'paused' && workout.pausedAt) {
    elapsed -= Math.floor((now - workout.pausedAt.getTime()) / 1000);
  }
  return Math.max(0, elapsed);
}

export function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Strong-style auto name: "Morning Workout", "Evening Workout", ... */
export function getWorkoutName(date: Date): string {
  const h = new Date(date).getHours();
  if (h < 5) return 'Night Workout';
  if (h < 12) return 'Morning Workout';
  if (h < 17) return 'Afternoon Workout';
  if (h < 21) return 'Evening Workout';
  return 'Night Workout';
}
