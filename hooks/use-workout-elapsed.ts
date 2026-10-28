import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { getWorkoutElapsedSeconds } from '@/lib/workout-time';
import type { Workout } from '@/lib/workout-store';

/** Ticking elapsed seconds for a workout. Wall-clock derived so backgrounding can't drift it. */
export function useWorkoutElapsed(workout: Workout | null): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!workout || workout.status === 'completed') return;
    const tick = () => setNow(Date.now());
    const interval = setInterval(tick, 1000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') tick();
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [workout?.id, workout?.status]);

  if (!workout) return 0;
  return getWorkoutElapsedSeconds(workout, now);
}
