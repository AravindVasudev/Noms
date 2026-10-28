import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import workoutStore, { Exercise, Workout, WorkoutSet } from './workout-store';
import { loadWeightUnit, saveWeightUnit, WeightUnit } from './weight';

export type TrainingState = {
  exercises: Exercise[];
  /** Completed workouts, newest first. */
  workouts: Workout[];
  /** All sets (history for charts + active workout rows). */
  sets: WorkoutSet[];
  activeWorkout: Workout | null;
  weightUnit: WeightUnit;
  initialized: boolean;
};

const initialState: TrainingState = {
  exercises: [],
  workouts: [],
  sets: [],
  activeWorkout: null,
  weightUnit: 'kg',
  initialized: false,
};

const initializeTraining = createAsyncThunk('training/initialize', async () => {
  // Failure-isolated: a corrupt training DB must never whitescreen the app.
  try {
    await workoutStore.init();
  } catch (e) {
    console.error('Training DB init failed:', e);
    return { ...initialState, initialized: true };
  }
  const [exercises, activeWorkout, workouts, sets, weightUnit] = await Promise.all([
    workoutStore.getAllExercises().catch(() => [] as Exercise[]),
    workoutStore.getActiveWorkout().catch(() => null),
    workoutStore.getCompletedWorkouts().catch(() => [] as Workout[]),
    workoutStore.getAllSets().catch(() => [] as WorkoutSet[]),
    loadWeightUnit(),
  ]);
  return { exercises, workouts, sets, activeWorkout, weightUnit, initialized: true };
});

const startWorkoutAsync = createAsyncThunk('training/startWorkout', async () => {
  // Single-active invariant: return the existing active workout if any.
  const existing = await workoutStore.getActiveWorkout();
  if (existing) return existing;
  return await workoutStore.insertWorkout(new Date());
});

const pauseWorkoutAsync = createAsyncThunk(
  'training/pauseWorkout',
  async ({ workout }: { workout: Workout }) => {
    if (workout.status !== 'active') return workout;
    return await workoutStore.updateWorkout(workout.id, {
      status: 'paused',
      pausedAt: new Date(),
    });
  }
);

const resumeWorkoutAsync = createAsyncThunk(
  'training/resumeWorkout',
  async ({ workout }: { workout: Workout }) => {
    if (workout.status !== 'paused') return workout;
    const now = Date.now();
    const pausedAt = workout.pausedAt ? workout.pausedAt.getTime() : now;
    const extra = Math.max(0, Math.floor((now - pausedAt) / 1000));
    return await workoutStore.updateWorkout(workout.id, {
      status: 'active',
      pausedAt: null,
      pausedTotalSeconds: workout.pausedTotalSeconds + extra,
    });
  }
);

const finishWorkoutAsync = createAsyncThunk(
  'training/finishWorkout',
  async ({ workout }: { workout: Workout }) => {
    // Finishing while paused folds the paused tail first.
    let pausedTotalSeconds = workout.pausedTotalSeconds;
    if (workout.status === 'paused') {
      const pausedAt = workout.pausedAt ? workout.pausedAt.getTime() : Date.now();
      pausedTotalSeconds += Math.max(0, Math.floor((Date.now() - pausedAt) / 1000));
    }
    return await workoutStore.updateWorkout(workout.id, {
      status: 'completed',
      endedAt: new Date(),
      pausedAt: null,
      pausedTotalSeconds,
    });
  }
);

const discardWorkoutAsync = createAsyncThunk(
  'training/discardWorkout',
  async ({ workoutId }: { workoutId: number }) => {
    await workoutStore.deleteWorkout(workoutId);
    return workoutId;
  }
);

const createExerciseAsync = createAsyncThunk(
  'training/createExercise',
  async ({
    name,
    bodyPart,
    variations,
    defaultVariation,
  }: {
    name: string;
    bodyPart: import('./workout-store').BodyPart;
    variations: string[];
    defaultVariation: string | null;
  }) => {
    return await workoutStore.createExercise({ name, bodyPart, variations, defaultVariation });
  }
);

const addExerciseToWorkoutAsync = createAsyncThunk(
  'training/addExerciseToWorkout',
  async ({
    workoutId,
    exerciseId,
    name,
    variation,
    unit,
  }: {
    workoutId: number;
    exerciseId?: number;
    name?: string;
    variation?: string | null;
    unit: WeightUnit;
  }) => {
    let exercise: Exercise;
    if (exerciseId != null) {
      const found = await workoutStore.getExerciseById(exerciseId);
      if (!found) throw new Error('Exercise not found');
      exercise = found;
    } else {
      exercise = await workoutStore.getOrCreateExercise(name ?? '', { bodyPart: 'other' });
    }
    const resolvedVariation =
      variation !== undefined
        ? variation
        : (exercise.defaultVariation ?? null);
    // Link the exercise to the workout with a placeholder set row so an
    // exercise with no logged sets still shows up in the workout.
    const set = await workoutStore.insertSet({
      workoutId,
      exerciseId: exercise.id,
      reps: null,
      weight: null,
      unit,
      variation: resolvedVariation,
    });
    return { exercise, set };
  }
);

const addSetAsync = createAsyncThunk(
  'training/addSet',
  async ({
    workoutId,
    exerciseId,
    reps,
    weight,
    unit,
    variation,
  }: {
    workoutId: number;
    exerciseId: number;
    reps: number | null;
    weight: number | null;
    unit: WeightUnit;
    variation?: string | null;
  }) => {
    return await workoutStore.insertSet({ workoutId, exerciseId, reps, weight, unit, variation: variation ?? null });
  }
);

const updateSetAsync = createAsyncThunk(
  'training/updateSet',
  async ({ id, reps, weight, completed }: { id: number; reps?: number | null; weight?: number | null; completed?: boolean }) => {
    await workoutStore.updateSet(id, { reps, weight, completed });
    return { id, reps, weight, completed };
  }
);

const removeSetAsync = createAsyncThunk('training/removeSet', async (id: number) => {
  await workoutStore.deleteSet(id);
  return id;
});

const removeExerciseFromWorkoutAsync = createAsyncThunk(
  'training/removeExerciseFromWorkout',
  async ({
    workoutId,
    exerciseId,
    variation,
  }: {
    workoutId: number;
    exerciseId: number;
    variation?: string | null;
  }) => {
    await workoutStore.deleteExerciseFromWorkout(workoutId, exerciseId, variation);
    return { workoutId, exerciseId, variation };
  }
);

const deleteWorkoutAsync = createAsyncThunk('training/deleteWorkout', async (id: number) => {
  await workoutStore.deleteWorkout(id);
  return id;
});

const setWeightUnitAsync = createAsyncThunk('training/setWeightUnit', async (unit: WeightUnit) => {
  await saveWeightUnit(unit);
  return unit;
});

const deleteExerciseAsync = createAsyncThunk('training/deleteExercise', async (id: number) => {
  await workoutStore.deleteExercise(id);
  return id;
});

const setTrainingData = createAsyncThunk(
  'training/setTrainingData',
  async (data: { exercises: Exercise[]; workouts: Workout[]; sets: WorkoutSet[] }) => {
    await workoutStore.init();
    const replaced = await workoutStore.replaceAll(data);
    // An import may contain an in-progress workout — surface it as resumable.
    const activeWorkout = await workoutStore.getActiveWorkout().catch(() => null);
    return { ...replaced, activeWorkout };
  }
);

const clearTrainingAsync = createAsyncThunk('training/clearAll', async () => {
  await workoutStore.dropTrainingTables();
  await workoutStore.init();
  await AsyncStorage.removeItem('weight-unit');
  const exercises = await workoutStore.getAllExercises();
  return { exercises };
});

const trainingSlice = createSlice({
  name: 'training',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(initializeTraining.fulfilled, (state, action) => {
        state.exercises = action.payload.exercises;
        state.workouts = action.payload.workouts;
        state.sets = action.payload.sets;
        state.activeWorkout = action.payload.activeWorkout;
        state.weightUnit = action.payload.weightUnit;
        state.initialized = true;
      })
      .addCase(startWorkoutAsync.fulfilled, (state, action) => {
        state.activeWorkout = action.payload;
      })
      .addCase(pauseWorkoutAsync.fulfilled, (state, action) => {
        if (state.activeWorkout && state.activeWorkout.id === action.payload.id) {
          state.activeWorkout = action.payload;
        }
      })
      .addCase(resumeWorkoutAsync.fulfilled, (state, action) => {
        if (state.activeWorkout && state.activeWorkout.id === action.payload.id) {
          state.activeWorkout = action.payload;
        }
      })
      .addCase(finishWorkoutAsync.fulfilled, (state, action) => {
        if (state.activeWorkout && state.activeWorkout.id === action.payload.id) {
          state.activeWorkout = null;
        }
        state.workouts.unshift(action.payload);
      })
      .addCase(discardWorkoutAsync.fulfilled, (state, action) => {
        const id = action.payload;
        if (state.activeWorkout && state.activeWorkout.id === id) {
          state.activeWorkout = null;
        }
        state.sets = state.sets.filter((s) => s.workoutId !== id);
        state.workouts = state.workouts.filter((w) => w.id !== id);
      })
      .addCase(addExerciseToWorkoutAsync.fulfilled, (state, action) => {
        const { exercise, set } = action.payload;
        if (!state.exercises.some((e) => e.id === exercise.id)) {
          state.exercises.push(exercise);
          state.exercises.sort((a, b) => a.name.localeCompare(b.name));
        }
        state.sets.push(set);
      })
      .addCase(createExerciseAsync.fulfilled, (state, action) => {
        const exercise = action.payload;
        if (!state.exercises.some((e) => e.id === exercise.id)) {
          state.exercises.push(exercise);
          state.exercises.sort((a, b) => a.name.localeCompare(b.name));
        }
      })
      .addCase(addSetAsync.fulfilled, (state, action) => {
        state.sets.push(action.payload);
      })
      .addCase(updateSetAsync.fulfilled, (state, action) => {
        const { id, reps, weight, completed } = action.payload;
        const set = state.sets.find((s) => s.id === id);
        if (set) {
          if (reps !== undefined) set.reps = reps;
          if (weight !== undefined) set.weight = weight;
          if (completed !== undefined) set.completed = completed;
        }
      })
      .addCase(removeSetAsync.fulfilled, (state, action) => {
        state.sets = state.sets.filter((s) => s.id !== action.payload);
      })
      .addCase(removeExerciseFromWorkoutAsync.fulfilled, (state, action) => {
        const { workoutId, exerciseId, variation } = action.payload;
        state.sets = state.sets.filter(
          (s) =>
            !(
              s.workoutId === workoutId &&
              s.exerciseId === exerciseId &&
              (variation === undefined || (s.variation ?? null) === (variation ?? null))
            )
        );
      })
      .addCase(deleteWorkoutAsync.fulfilled, (state, action) => {
        const id = action.payload;
        state.workouts = state.workouts.filter((w) => w.id !== id);
        state.sets = state.sets.filter((s) => s.workoutId !== id);
      })
      .addCase(deleteExerciseAsync.fulfilled, (state, action) => {
        const id = action.payload;
        state.exercises = state.exercises.filter((e) => e.id !== id);
        state.sets = state.sets.filter((s) => s.exerciseId !== id);
      })
      .addCase(setWeightUnitAsync.fulfilled, (state, action) => {
        state.weightUnit = action.payload;
      })
      .addCase(setTrainingData.fulfilled, (state, action) => {
        state.exercises = action.payload.exercises;
        state.workouts = action.payload.workouts;
        state.sets = action.payload.sets;
        state.activeWorkout = action.payload.activeWorkout;
      })
      .addCase(clearTrainingAsync.fulfilled, (state, action) => {
        state.exercises = action.payload.exercises;
        state.workouts = [];
        state.sets = [];
        state.activeWorkout = null;
        state.weightUnit = 'kg';
      });
  },
});

export {
  addExerciseToWorkoutAsync,
  addSetAsync,
  clearTrainingAsync,
  createExerciseAsync,
  deleteExerciseAsync,
  deleteWorkoutAsync,
  discardWorkoutAsync,
  finishWorkoutAsync,
  initializeTraining,
  pauseWorkoutAsync,
  removeExerciseFromWorkoutAsync,
  removeSetAsync,
  resumeWorkoutAsync,
  setTrainingData,
  setWeightUnitAsync,
  startWorkoutAsync,
  updateSetAsync,
};
export default trainingSlice.reducer;
