import * as SQLite from 'expo-sqlite';

import type { WeightUnit } from './weight';

export type Exercise = {
  id: number;
  name: string;
  muscleGroup: string | null;
  isCustom: boolean;
};

export type WorkoutStatus = 'active' | 'paused' | 'completed';

export type Workout = {
  id: number;
  startedAt: Date;
  endedAt: Date | null;
  status: WorkoutStatus;
  pausedTotalSeconds: number;
  pausedAt: Date | null;
};

export type WorkoutSet = {
  id: number;
  workoutId: number;
  exerciseId: number;
  setIndex: number;
  reps: number | null;
  weight: number | null;
  unit: WeightUnit;
  completed: boolean;
};

type WorkoutRow = {
  id: number;
  started_at: string;
  ended_at: string | null;
  status: string;
  paused_total_seconds: number;
  paused_at: string | null;
};

const SEEDED_EXERCISES: { name: string; muscleGroup: string }[] = [
  { name: 'Bench Press', muscleGroup: 'Chest' },
  { name: 'Incline Bench Press', muscleGroup: 'Chest' },
  { name: 'Overhead Press', muscleGroup: 'Shoulders' },
  { name: 'Lateral Raise', muscleGroup: 'Shoulders' },
  { name: 'Barbell Row', muscleGroup: 'Back' },
  { name: 'Lat Pulldown', muscleGroup: 'Back' },
  { name: 'Pull-Up', muscleGroup: 'Back' },
  { name: 'Deadlift', muscleGroup: 'Back' },
  { name: 'Squat', muscleGroup: 'Legs' },
  { name: 'Leg Press', muscleGroup: 'Legs' },
  { name: 'Hip Thrust', muscleGroup: 'Legs' },
  { name: 'Bicep Curl', muscleGroup: 'Arms' },
  { name: 'Triceps Pushdown', muscleGroup: 'Arms' },
  { name: 'Dips', muscleGroup: 'Chest' },
];

const isValidStatus = (s: string): s is WorkoutStatus =>
  s === 'active' || s === 'paused' || s === 'completed';

const toWorkout = (r: WorkoutRow): Workout | null => {
  if (!isValidStatus(r.status)) return null;
  const startedAt = new Date(r.started_at);
  if (Number.isNaN(startedAt.getTime())) return null;
  const endedAt = r.ended_at ? new Date(r.ended_at) : null;
  const pausedAt = r.paused_at ? new Date(r.paused_at) : null;
  if ((r.ended_at && (!endedAt || Number.isNaN(endedAt.getTime()))) ||
      (r.paused_at && (!pausedAt || Number.isNaN(pausedAt.getTime())))) {
    return null;
  }
  return {
    id: r.id,
    startedAt,
    endedAt,
    status: r.status,
    pausedTotalSeconds: Number(r.paused_total_seconds) || 0,
    pausedAt,
  };
};

const toUnit = (u: unknown): WeightUnit => (u === 'lb' ? 'lb' : 'kg');

class WorkoutStore {
  private _db: any = null;
  constructor() {}

  private async getDb() {
    if (!this._db) {
      this._db = await SQLite.openDatabaseAsync('diary.db');
      await this._db.execAsync('PRAGMA foreign_keys = ON');
    }
    return this._db;
  }

  async init() {
    const db = await this.getDb();
    await db.execAsync(
      `CREATE TABLE IF NOT EXISTS exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE COLLATE NOCASE,
        muscle_group TEXT,
        is_custom INTEGER NOT NULL DEFAULT 0
      )`
    );
    await db.execAsync(
      `CREATE TABLE IF NOT EXISTS workouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        paused_total_seconds INTEGER NOT NULL DEFAULT 0,
        paused_at TEXT
      )`
    );
    // Migrate dev DBs created before pause columns existed.
    const workoutColumns: any[] = await db.getAllAsync('PRAGMA table_info(workouts)');
    const columnNames = new Set(workoutColumns.map((c) => c.name));
    if (!columnNames.has('paused_total_seconds')) {
      await db.execAsync('ALTER TABLE workouts ADD COLUMN paused_total_seconds INTEGER NOT NULL DEFAULT 0');
    }
    if (!columnNames.has('paused_at')) {
      await db.execAsync('ALTER TABLE workouts ADD COLUMN paused_at TEXT');
    }
    if (!columnNames.has('status')) {
      await db.execAsync("ALTER TABLE workouts ADD COLUMN status TEXT NOT NULL DEFAULT 'active'");
    }
    if (!columnNames.has('ended_at')) {
      await db.execAsync('ALTER TABLE workouts ADD COLUMN ended_at TEXT');
    }
    await db.execAsync(
      `CREATE TABLE IF NOT EXISTS workout_sets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
        exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
        set_index INTEGER NOT NULL,
        reps INTEGER,
        weight REAL,
        unit TEXT NOT NULL DEFAULT 'kg',
        completed INTEGER NOT NULL DEFAULT 0
      )`
    );
    const setColumns: any[] = await db.getAllAsync('PRAGMA table_info(workout_sets)');
    if (!setColumns.some((c) => c.name === 'unit')) {
      await db.execAsync("ALTER TABLE workout_sets ADD COLUMN unit TEXT NOT NULL DEFAULT 'kg'");
    }
    if (!setColumns.some((c) => c.name === 'completed')) {
      await db.execAsync('ALTER TABLE workout_sets ADD COLUMN completed INTEGER NOT NULL DEFAULT 0');
      // Pre-flag rows predate the checkmark: anything with reps was a logged set.
      await db.runAsync('UPDATE workout_sets SET completed = 1 WHERE reps IS NOT NULL');
    }
    // Seed built-in exercises. INSERT OR IGNORE makes re-init idempotent
    // and COLLATE NOCASE dedups user-created case variants.
    for (const ex of SEEDED_EXERCISES) {
      await db.runAsync(
        'INSERT OR IGNORE INTO exercises (name, muscle_group, is_custom) VALUES (?, ?, 0)',
        [ex.name, ex.muscleGroup]
      );
    }
    // Sweep orphan sets in case foreign_keys was off when they were written.
    await db.runAsync(
      'DELETE FROM workout_sets WHERE workout_id NOT IN (SELECT id FROM workouts) OR exercise_id NOT IN (SELECT id FROM exercises)'
    );
  }

  async getAllExercises(): Promise<Exercise[]> {
    const db = await this.getDb();
    const rows: any[] = await db.getAllAsync('SELECT * FROM exercises ORDER BY name COLLATE NOCASE ASC');
    return rows.map((r) => ({
      id: r.id,
      name: String(r.name),
      muscleGroup: r.muscle_group == null ? null : String(r.muscle_group),
      isCustom: Number(r.is_custom) === 1,
    }));
  }

  /** Case-insensitive get-or-create. Double-tap safe via INSERT OR IGNORE. */
  async getOrCreateExercise(name: string): Promise<Exercise> {
    const trimmed = name.trim();
    const db = await this.getDb();
    await db.runAsync(
      'INSERT OR IGNORE INTO exercises (name, muscle_group, is_custom) VALUES (?, NULL, 1)',
      [trimmed]
    );
    const row: any = await db.getFirstAsync(
      'SELECT * FROM exercises WHERE name = ? COLLATE NOCASE',
      [trimmed]
    );
    return {
      id: row.id,
      name: String(row.name),
      muscleGroup: row.muscle_group == null ? null : String(row.muscle_group),
      isCustom: Number(row.is_custom) === 1,
    };
  }

  async getActiveWorkout(): Promise<Workout | null> {
    const db = await this.getDb();
    const row: any = await db.getFirstAsync(
      "SELECT * FROM workouts WHERE status IN ('active', 'paused') ORDER BY id DESC LIMIT 1"
    );
    if (!row) return null;
    return toWorkout(row as WorkoutRow);
  }

  async getCompletedWorkouts(limit = 200): Promise<Workout[]> {
    const db = await this.getDb();
    const rows: any[] = await db.getAllAsync(
      "SELECT * FROM workouts WHERE status = 'completed' ORDER BY started_at DESC LIMIT ?",
      [limit]
    );
    const out: Workout[] = [];
    for (const r of rows) {
      const w = toWorkout(r as WorkoutRow);
      if (w) out.push(w);
    }
    return out;
  }

  async getSetsForWorkout(workoutId: number): Promise<WorkoutSet[]> {
    const db = await this.getDb();
    const rows: any[] = await db.getAllAsync(
      'SELECT * FROM workout_sets WHERE workout_id = ? ORDER BY id ASC',
      [workoutId]
    );
    return rows.map((r) => ({
      id: r.id,
      workoutId: r.workout_id,
      exerciseId: r.exercise_id,
      setIndex: Number(r.set_index),
      reps: r.reps == null ? null : Number(r.reps),
      weight: r.weight == null ? null : Number(r.weight),
      unit: toUnit(r.unit),
      completed: Number(r.completed) === 1,
    }));
  }

  async getAllSets(): Promise<WorkoutSet[]> {
    const db = await this.getDb();
    const rows: any[] = await db.getAllAsync('SELECT * FROM workout_sets ORDER BY id ASC');
    return rows.map((r) => ({
      id: r.id,
      workoutId: r.workout_id,
      exerciseId: r.exercise_id,
      setIndex: Number(r.set_index),
      reps: r.reps == null ? null : Number(r.reps),
      weight: r.weight == null ? null : Number(r.weight),
      unit: toUnit(r.unit),
      completed: Number(r.completed) === 1,
    }));
  }

  async insertWorkout(startedAt: Date): Promise<Workout> {
    const db = await this.getDb();
    const res = await db.runAsync(
      "INSERT INTO workouts (started_at, status, paused_total_seconds) VALUES (?, 'active', 0)",
      [startedAt.toISOString()]
    );
    const row: any = await db.getFirstAsync('SELECT * FROM workouts WHERE id = ?', [
      res.lastInsertRowId,
    ]);
    const w = toWorkout(row as WorkoutRow);
    if (!w) throw new Error('Failed to create workout');
    return w;
  }

  async updateWorkout(
    id: number,
    fields: { status?: WorkoutStatus; endedAt?: Date | null; pausedTotalSeconds?: number; pausedAt?: Date | null }
  ): Promise<Workout> {
    const db = await this.getDb();
    const sets: string[] = [];
    const params: any[] = [];
    if (fields.status !== undefined) {
      sets.push('status = ?');
      params.push(fields.status);
    }
    if (fields.endedAt !== undefined) {
      sets.push('ended_at = ?');
      params.push(fields.endedAt ? fields.endedAt.toISOString() : null);
    }
    if (fields.pausedTotalSeconds !== undefined) {
      sets.push('paused_total_seconds = ?');
      params.push(fields.pausedTotalSeconds);
    }
    if (fields.pausedAt !== undefined) {
      sets.push('paused_at = ?');
      params.push(fields.pausedAt ? fields.pausedAt.toISOString() : null);
    }
    params.push(id);
    await db.runAsync(`UPDATE workouts SET ${sets.join(', ')} WHERE id = ?`, params);
    const row: any = await db.getFirstAsync('SELECT * FROM workouts WHERE id = ?', [id]);
    const w = toWorkout(row as WorkoutRow);
    if (!w) throw new Error('Workout not found after update');
    return w;
  }

  async deleteWorkout(id: number): Promise<void> {
    const db = await this.getDb();
    await db.runAsync('DELETE FROM workout_sets WHERE workout_id = ?', [id]);
    await db.runAsync('DELETE FROM workouts WHERE id = ?', [id]);
  }

  async insertSet(args: {
    workoutId: number;
    exerciseId: number;
    reps: number | null;
    weight: number | null;
    unit: WeightUnit;
  }): Promise<WorkoutSet> {
    const db = await this.getDb();
    const row: any = await db.getFirstAsync(
      'SELECT COALESCE(MAX(set_index), 0) AS maxIdx FROM workout_sets WHERE workout_id = ? AND exercise_id = ?',
      [args.workoutId, args.exerciseId]
    );
    const nextIndex = Number(row?.maxIdx ?? 0) + 1;
    const res = await db.runAsync(
      'INSERT INTO workout_sets (workout_id, exercise_id, set_index, reps, weight, unit, completed) VALUES (?, ?, ?, ?, ?, ?, 0)',
      [args.workoutId, args.exerciseId, nextIndex, args.reps, args.weight, args.unit]
    );
    return {
      id: res.lastInsertRowId,
      workoutId: args.workoutId,
      exerciseId: args.exerciseId,
      setIndex: nextIndex,
      reps: args.reps,
      weight: args.weight,
      unit: args.unit,
      completed: false,
    };
  }

  async updateSet(
    id: number,
    fields: { reps?: number | null; weight?: number | null; completed?: boolean }
  ): Promise<void> {
    const db = await this.getDb();
    const sets: string[] = [];
    const params: any[] = [];
    if (fields.reps !== undefined) {
      sets.push('reps = ?');
      params.push(fields.reps);
    }
    if (fields.weight !== undefined) {
      sets.push('weight = ?');
      params.push(fields.weight);
    }
    if (fields.completed !== undefined) {
      sets.push('completed = ?');
      params.push(fields.completed ? 1 : 0);
    }
    if (sets.length === 0) return;
    params.push(id);
    await db.runAsync(`UPDATE workout_sets SET ${sets.join(', ')} WHERE id = ?`, params);
  }

  async deleteSet(id: number): Promise<void> {
    const db = await this.getDb();
    await db.runAsync('DELETE FROM workout_sets WHERE id = ?', [id]);
  }

  async deleteExerciseFromWorkout(workoutId: number, exerciseId: number): Promise<void> {
    const db = await this.getDb();
    await db.runAsync('DELETE FROM workout_sets WHERE workout_id = ? AND exercise_id = ?', [
      workoutId,
      exerciseId,
    ]);
  }

  async replaceAll(data: { exercises: Exercise[]; workouts: Workout[]; sets: WorkoutSet[] }): Promise<{
    exercises: Exercise[];
    workouts: Workout[];
    sets: WorkoutSet[];
  }> {
    const db = await this.getDb();
    await db.execAsync('DELETE FROM workout_sets; DELETE FROM workouts; DELETE FROM exercises;');
    const exerciseIdMap = new Map<number, number>();
    const exercises: Exercise[] = [];
    for (const ex of data.exercises) {
      const name = String(ex.name ?? '').trim();
      if (!name) continue;
      // INSERT OR IGNORE leaves lastInsertRowId stale when ignored, so
      // always re-read the row instead of trusting it.
      await db.runAsync(
        'INSERT OR IGNORE INTO exercises (name, muscle_group, is_custom) VALUES (?, ?, ?)',
        [name, ex.muscleGroup ?? null, ex.isCustom ? 1 : 0]
      );
      const existing: any = await db.getFirstAsync(
        'SELECT id FROM exercises WHERE name = ? COLLATE NOCASE',
        [name]
      );
      if (existing?.id == null) continue;
      if (ex.id != null) exerciseIdMap.set(ex.id, existing.id);
      exercises.push({ id: existing.id, name, muscleGroup: ex.muscleGroup ?? null, isCustom: !!ex.isCustom });
    }
    const workoutIdMap = new Map<number, number>();
    const workouts: Workout[] = [];
    for (const w of data.workouts) {
      if (!w.startedAt || Number.isNaN(new Date(w.startedAt as any).getTime())) continue;
      const status = isValidStatus(w.status as string) ? w.status : 'completed';
      const res = await db.runAsync(
        'INSERT INTO workouts (started_at, ended_at, status, paused_total_seconds, paused_at) VALUES (?, ?, ?, ?, ?)',
        [
          new Date(w.startedAt as any).toISOString(),
          w.endedAt ? new Date(w.endedAt as any).toISOString() : null,
          status,
          Number(w.pausedTotalSeconds) || 0,
          w.pausedAt ? new Date(w.pausedAt as any).toISOString() : null,
        ]
      );
      if (w.id != null) workoutIdMap.set(w.id, res.lastInsertRowId);
      const row: any = await db.getFirstAsync('SELECT * FROM workouts WHERE id = ?', [
        res.lastInsertRowId,
      ]);
      const parsed = toWorkout(row as WorkoutRow);
      if (parsed) workouts.push(parsed);
    }
    const sets: WorkoutSet[] = [];
    for (const s of data.sets) {
      // Skip sets whose parent rows didn't survive (dangling export refs).
      const workoutId = workoutIdMap.get(s.workoutId);
      const exerciseId = exerciseIdMap.get(s.exerciseId);
      if (workoutId == null || exerciseId == null) continue;
      const res = await db.runAsync(
        'INSERT INTO workout_sets (workout_id, exercise_id, set_index, reps, weight, unit, completed) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [workoutId, exerciseId, Number(s.setIndex) || 1, s.reps, s.weight, toUnit(s.unit), s.completed ? 1 : 0]
      );
      sets.push({
        id: res.lastInsertRowId,
        workoutId,
        exerciseId,
        setIndex: Number(s.setIndex) || 1,
        reps: s.reps ?? null,
        weight: s.weight ?? null,
        unit: toUnit(s.unit),
        completed: !!s.completed,
      });
    }
    // Drop sets whose FK targets didn't survive (keeps import total-replace safe).
    await db.runAsync(
      'DELETE FROM workout_sets WHERE workout_id NOT IN (SELECT id FROM workouts) OR exercise_id NOT IN (SELECT id FROM exercises)'
    );
    return { exercises: await this.getAllExercises(), workouts: await this.getCompletedWorkouts(), sets: await this.getAllSets() };
  }

  async dropTrainingTables(): Promise<void> {
    const db = await this.getDb();
    await db.execAsync(
      'DROP TABLE IF EXISTS workout_sets; DROP TABLE IF EXISTS workouts; DROP TABLE IF EXISTS exercises;'
    );
  }
}

const workoutStore = new WorkoutStore();

export default workoutStore;
