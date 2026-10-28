import * as SQLite from 'expo-sqlite';

import type { WeightUnit } from './weight';

export type BodyPart =
  | 'core'
  | 'arms'
  | 'back'
  | 'chest'
  | 'legs'
  | 'shoulders'
  | 'other'
  | 'cardio'
  | 'full body';

export const BODY_PARTS: BodyPart[] = [
  'core',
  'arms',
  'back',
  'chest',
  'legs',
  'shoulders',
  'other',
  'cardio',
  'full body',
];

export const DEFAULT_SKELETON_IMAGE = 'default-skeleton';
export const CUSTOM_SKELETON_IMAGE = 'custom-skeleton';

export const titleCaseVariation = (s: string): string =>
  s
    .split(' ')
    .map((w) => (w.length === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');

export const formatExerciseRef = (name: string, variation: string | null): string =>
  variation == null ? name : `${name} (${titleCaseVariation(variation)})`;

export type Exercise = {
  id: number;
  name: string;
  bodyPart: BodyPart | null;
  variations: string[];
  defaultVariation: string | null;
  imageKey: string;
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
  variation: string | null;
};

type WorkoutRow = {
  id: number;
  started_at: string;
  ended_at: string | null;
  status: string;
  paused_total_seconds: number;
  paused_at: string | null;
};

const SEEDED_EXERCISES: { name: string; bodyPart: BodyPart; variations: string[]; imageKey: string }[] = [
  { name: 'Bench Press', bodyPart: 'chest', variations: ['dumbbells', 'barbell', 'smith machine', 'machine'], imageKey: 'bench-press' },
  { name: 'Incline Bench Press', bodyPart: 'chest', variations: ['dumbbells', 'barbell', 'smith machine', 'machine'], imageKey: 'incline-bench-press' },
  { name: 'Overhead Press', bodyPart: 'shoulders', variations: ['dumbbells', 'barbell', 'machine'], imageKey: 'overhead-press' },
  { name: 'Lateral Raise', bodyPart: 'shoulders', variations: ['dumbbells', 'cable', 'machine'], imageKey: 'lateral-raise' },
  { name: 'Barbell Row', bodyPart: 'back', variations: ['barbell', 'dumbbells', 'machine'], imageKey: 'barbell-row' },
  { name: 'Lat Pulldown', bodyPart: 'back', variations: ['machine', 'cable'], imageKey: 'lat-pulldown' },
  { name: 'Pull-Up', bodyPart: 'back', variations: ['bodyweight', 'weighted'], imageKey: 'pull-up' },
  { name: 'Deadlift', bodyPart: 'back', variations: ['barbell', 'dumbbells', 'trap bar'], imageKey: 'deadlift' },
  { name: 'Squat', bodyPart: 'legs', variations: ['barbell', 'dumbbells', 'smith machine', 'machine'], imageKey: 'squat' },
  { name: 'Leg Press', bodyPart: 'legs', variations: ['machine'], imageKey: 'leg-press' },
  { name: 'Hip Thrust', bodyPart: 'legs', variations: ['barbell', 'dumbbells', 'machine'], imageKey: 'hip-thrust' },
  { name: 'Bicep Curl', bodyPart: 'arms', variations: ['dumbbells', 'barbell', 'cable', 'machine'], imageKey: 'bicep-curl' },
  { name: 'Triceps Pushdown', bodyPart: 'arms', variations: ['cable', 'machine'], imageKey: 'triceps-pushdown' },
  { name: 'Dips', bodyPart: 'chest', variations: ['bodyweight', 'weighted'], imageKey: 'dips' },
];

const isBodyPart = (s: unknown): s is BodyPart =>
  typeof s === 'string' && (BODY_PARTS as string[]).includes(s);

const parseVariations = (raw: unknown): string[] => {
  if (typeof raw !== 'string' || raw.trim() === '') return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out: string[] = [];
    for (const v of parsed) {
      if (typeof v !== 'string') continue;
      const t = v.trim();
      if (!t) continue;
      if (out.some((e) => e.toLowerCase() === t.toLowerCase())) continue;
      out.push(t);
      if (out.length >= 20) break;
    }
    return out;
  } catch {
    return [];
  }
};

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
        is_custom INTEGER NOT NULL DEFAULT 0,
        body_part TEXT,
        variations_json TEXT NOT NULL DEFAULT '[]',
        default_variation TEXT,
        image_key TEXT NOT NULL DEFAULT '${DEFAULT_SKELETON_IMAGE}'
      )`
    );
    // Dev-migration guards: add new columns to pre-existing tables.
    const exerciseColumns: any[] = await db.getAllAsync('PRAGMA table_info(exercises)');
    const exNames = new Set(exerciseColumns.map((c) => c.name));
    if (!exNames.has('body_part')) {
      await db.execAsync('ALTER TABLE exercises ADD COLUMN body_part TEXT');
    }
    if (!exNames.has('variations_json')) {
      await db.execAsync("ALTER TABLE exercises ADD COLUMN variations_json TEXT NOT NULL DEFAULT '[]'");
    }
    if (!exNames.has('default_variation')) {
      await db.execAsync('ALTER TABLE exercises ADD COLUMN default_variation TEXT');
    }
    if (!exNames.has('image_key')) {
      await db.execAsync(`ALTER TABLE exercises ADD COLUMN image_key TEXT NOT NULL DEFAULT '${DEFAULT_SKELETON_IMAGE}'`);
    }
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
    if (!setColumns.some((c) => c.name === 'variation')) {
      await db.execAsync('ALTER TABLE workout_sets ADD COLUMN variation TEXT');
    }
    // Seed built-in exercises. INSERT OR IGNORE makes re-init idempotent
    // and COLLATE NOCASE dedups user-created case variants; UPDATE keeps
    // seed metadata (body part / variations) fresh on dev rewrites.
    for (const ex of SEEDED_EXERCISES) {
      const variations = ex.variations.slice(0, 20);
      await db.runAsync(
        'INSERT OR IGNORE INTO exercises (name, muscle_group, is_custom, body_part, variations_json, default_variation, image_key) VALUES (?, ?, 0, ?, ?, ?, ?)',
        [ex.name, ex.bodyPart, ex.bodyPart, JSON.stringify(variations), variations[0] ?? null, ex.imageKey]
      );
      await db.runAsync(
        'UPDATE exercises SET body_part = ?, variations_json = ?, default_variation = ?, image_key = ? WHERE name = ? COLLATE NOCASE AND is_custom = 0',
        [ex.bodyPart, JSON.stringify(variations), variations[0] ?? null, ex.imageKey, ex.name]
      );
    }
    // Ensure every row has an image key for the bundled placeholders.
    await db.runAsync(
      `UPDATE exercises SET image_key = CASE WHEN is_custom = 1 THEN '${CUSTOM_SKELETON_IMAGE}' ELSE '${DEFAULT_SKELETON_IMAGE}' END WHERE image_key IS NULL OR image_key = ''`
    );
    // Sweep orphan sets in case foreign_keys was off when they were written.
    await db.runAsync(
      'DELETE FROM workout_sets WHERE workout_id NOT IN (SELECT id FROM workouts) OR exercise_id NOT IN (SELECT id FROM exercises)'
    );
  }

  private toExercise(r: any): Exercise {
    const variations = parseVariations(r.variations_json);
    const dv = r.default_variation == null ? null : String(r.default_variation);
    const bodyPart = isBodyPart(r.body_part) ? (r.body_part as BodyPart) : null;
    return {
      id: r.id,
      name: String(r.name),
      bodyPart,
      variations,
      defaultVariation: dv && variations.some((v) => v.toLowerCase() === dv.toLowerCase()) ? dv : (variations[0] ?? null),
      imageKey: r.image_key == null || String(r.image_key) === '' ? (Number(r.is_custom) === 1 ? CUSTOM_SKELETON_IMAGE : DEFAULT_SKELETON_IMAGE) : String(r.image_key),
      isCustom: Number(r.is_custom) === 1,
    };
  }

  async getAllExercises(): Promise<Exercise[]> {
    const db = await this.getDb();
    const rows: any[] = await db.getAllAsync('SELECT * FROM exercises ORDER BY name COLLATE NOCASE ASC');
    return rows.map((r) => this.toExercise(r));
  }

  async getExerciseById(id: number): Promise<Exercise | null> {
    const db = await this.getDb();
    const row: any = await db.getFirstAsync('SELECT * FROM exercises WHERE id = ?', [id]);
    if (!row) return null;
    return this.toExercise(row);
  }

  /** Case-insensitive get-or-create. Double-tap safe via INSERT OR IGNORE. */
  async getOrCreateExercise(
    name: string,
    opts?: { bodyPart?: BodyPart | null; imageKey?: string }
  ): Promise<Exercise> {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Exercise name is required');
    const db = await this.getDb();
    await db.runAsync(
      `INSERT OR IGNORE INTO exercises (name, muscle_group, is_custom, body_part, variations_json, default_variation, image_key) VALUES (?, NULL, 1, ?, '[]', NULL, ?)`,
      [trimmed, opts?.bodyPart ?? 'other', opts?.imageKey ?? CUSTOM_SKELETON_IMAGE]
    );
    const row: any = await db.getFirstAsync(
      'SELECT * FROM exercises WHERE name = ? COLLATE NOCASE',
      [trimmed]
    );
    return this.toExercise(row);
  }

  /** Validated create for custom exercises from the Create modal. Throws on duplicate. */
  async createExercise(args: {
    name: string;
    bodyPart: BodyPart;
    variations: string[];
    defaultVariation: string | null;
  }): Promise<Exercise> {
    const name = args.name.trim();
    if (!name) throw new Error('Exercise name is required');
    if (!isBodyPart(args.bodyPart)) throw new Error('Body part is required');
    const variations: string[] = [];
    for (const v of args.variations) {
      const t = String(v ?? '').trim();
      if (!t) continue;
      if (variations.some((e) => e.toLowerCase() === t.toLowerCase())) continue;
      variations.push(t);
      if (variations.length >= 20) break;
    }
    let def = args.defaultVariation?.trim() ? String(args.defaultVariation).trim() : null;
    if (variations.length === 0) {
      def = null;
    } else if (!def || !variations.some((v) => v.toLowerCase() === def!.toLowerCase())) {
      def = variations[0];
    }
    const db = await this.getDb();
    const existing: any = await db.getFirstAsync(
      'SELECT id FROM exercises WHERE name = ? COLLATE NOCASE',
      [name]
    );
    if (existing) throw new Error('An exercise with this name already exists');
    const res = await db.runAsync(
      'INSERT INTO exercises (name, muscle_group, is_custom, body_part, variations_json, default_variation, image_key) VALUES (?, ?, 1, ?, ?, ?, ?)',
      [name, args.bodyPart, args.bodyPart, JSON.stringify(variations), def, CUSTOM_SKELETON_IMAGE]
    );
    const row: any = await db.getFirstAsync('SELECT * FROM exercises WHERE id = ?', [
      res.lastInsertRowId,
    ]);
    return this.toExercise(row);
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
      variation: r.variation == null ? null : String(r.variation),
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
      variation: r.variation == null ? null : String(r.variation),
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
    variation?: string | null;
  }): Promise<WorkoutSet> {
    const db = await this.getDb();
    const row: any = await db.getFirstAsync(
      'SELECT COALESCE(MAX(set_index), 0) AS maxIdx FROM workout_sets WHERE workout_id = ? AND exercise_id = ?',
      [args.workoutId, args.exerciseId]
    );
    const nextIndex = Number(row?.maxIdx ?? 0) + 1;
    const variation = args.variation ?? null;
    const res = await db.runAsync(
      'INSERT INTO workout_sets (workout_id, exercise_id, set_index, reps, weight, unit, completed, variation) VALUES (?, ?, ?, ?, ?, ?, 0, ?)',
      [args.workoutId, args.exerciseId, nextIndex, args.reps, args.weight, args.unit, variation]
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
      variation,
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

  async deleteExerciseFromWorkout(workoutId: number, exerciseId: number, variation?: string | null): Promise<void> {    const db = await this.getDb();
    if (variation === undefined) {
      await db.runAsync('DELETE FROM workout_sets WHERE workout_id = ? AND exercise_id = ?', [
        workoutId,
        exerciseId,
      ]);
    } else {
      await db.runAsync(
        "DELETE FROM workout_sets WHERE workout_id = ? AND exercise_id = ? AND COALESCE(variation, '') = COALESCE(?, '')",
        [workoutId, exerciseId, variation]
      );
    }
  }

  async deleteExercise(exerciseId: number): Promise<void> {
    const db = await this.getDb();
    await db.runAsync('DELETE FROM workout_sets WHERE exercise_id = ?', [exerciseId]);
    await db.runAsync('DELETE FROM exercises WHERE id = ?', [exerciseId]);
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
      const name = String((ex as any).name ?? '').trim();
      if (!name) continue;
      // Backward compat: old exports carry muscleGroup instead of bodyPart.
      const rawBody = (ex as any).bodyPart ?? (ex as any).muscleGroup ?? null;
      const bodyPart: BodyPart | null =
        typeof rawBody === 'string' && isBodyPart(rawBody.toLowerCase())
          ? (rawBody.toLowerCase() as BodyPart)
          : typeof rawBody === 'string' && isBodyPart(rawBody)
            ? (rawBody as BodyPart)
            : 'other';
      const rawVars = Array.isArray((ex as any).variations) ? (ex as any).variations : [];
      const variations: string[] = [];
      for (const v of rawVars) {
        if (typeof v !== 'string' || !v.trim()) continue;
        if (variations.some((e) => e.toLowerCase() === v.trim().toLowerCase())) continue;
        variations.push(v.trim());
      }
      const rawDef = (ex as any).defaultVariation ?? null;
      const def = rawDef && variations.some((v) => v.toLowerCase() === String(rawDef).toLowerCase())
        ? String(rawDef)
        : (variations[0] ?? null);
      const imageKey =
        typeof (ex as any).imageKey === 'string' && (ex as any).imageKey
          ? String((ex as any).imageKey)
          : (ex as any).isCustom
            ? CUSTOM_SKELETON_IMAGE
            : DEFAULT_SKELETON_IMAGE;
      // INSERT OR IGNORE leaves lastInsertRowId stale when ignored, so
      // always re-read the row instead of trusting it.
      await db.runAsync(
        'INSERT OR IGNORE INTO exercises (name, muscle_group, is_custom, body_part, variations_json, default_variation, image_key) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, typeof rawBody === 'string' ? rawBody : null, (ex as any).isCustom ? 1 : 0, bodyPart, JSON.stringify(variations), def, imageKey]
      );
      const existing: any = await db.getFirstAsync(
        'SELECT id FROM exercises WHERE name = ? COLLATE NOCASE',
        [name]
      );
      if (existing?.id == null) continue;
      if ((ex as any).id != null) exerciseIdMap.set((ex as any).id, existing.id);
      const full: any = await db.getFirstAsync('SELECT * FROM exercises WHERE id = ?', [existing.id]);
      exercises.push(this.toExercise(full));
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
        'INSERT INTO workout_sets (workout_id, exercise_id, set_index, reps, weight, unit, completed, variation) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [workoutId, exerciseId, Number(s.setIndex) || 1, s.reps, s.weight, toUnit(s.unit), s.completed ? 1 : 0, (s as any).variation ?? null]
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
        variation: (s as any).variation ?? null,
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
