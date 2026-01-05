import * as SQLite from 'expo-sqlite';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

type Nutrition = {
  id?: number;
  name: string;
  calories: number | null;
  fat: number | null;
  protein: number | null;
  carbs: number | null;
  fiber: number | null;
  date: string; // ISO YYYY-MM-DD
};

type DiaryContextValue = {
  diary: Nutrition[];
  addEntry: (entry: Omit<Nutrition, 'id'>) => Promise<void>;
  removeEntry: (index: number) => Promise<void>;
};

const DiaryContext = createContext<DiaryContextValue | undefined>(undefined);

let db: SQLite.SQLiteDatabase | null = null;

async function getDb() {
  if (!db) {
    db = await SQLite.openDatabaseAsync('diary.db');
  }
  return db;
}

export function DiaryProvider({ children }: { children: ReactNode }) {
  const [diary, setDiary] = useState<Nutrition[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const database = await getDb();
        await database.execAsync(
          `CREATE TABLE IF NOT EXISTS nutrition (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            calories REAL,
            fat REAL,
            protein REAL,
            carbs REAL,
            fiber REAL,
            date TEXT
          )`
        );

        const rows: any[] = await database.getAllAsync('SELECT * FROM nutrition ORDER BY id ASC');
        const parsed = rows.map((r) => ({
          id: r.id,
          name: r.name,
          calories: r.calories == null ? null : Number(r.calories),
          fat: r.fat == null ? null : Number(r.fat),
          protein: r.protein == null ? null : Number(r.protein),
          carbs: r.carbs == null ? null : Number(r.carbs),
          fiber: r.fiber == null ? null : Number(r.fiber),
          date: r.date,
        }));
        setDiary(parsed);
      } catch (e) {
        // If desired, handle DB errors or surface to analytics
        console.warn('Failed to initialize diary DB', e);
      }
    })();
  }, []);

  const addEntry = async (entry: Omit<Nutrition, 'id'>) => {
    const params = [
      entry.name,
      entry.calories,
      entry.fat,
      entry.protein,
      entry.carbs,
      entry.fiber,
      entry.date,
    ];

    const database = await getDb();
    const res: any = await database.runAsync(
      'INSERT INTO nutrition (name, calories, fat, protein, carbs, fiber, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      params
    );
    const insertId = res && (res as any).insertId ? (res as any).insertId : undefined;
    const newEntry: Nutrition = { ...(entry as Nutrition) };
    if (insertId != null) newEntry.id = insertId;
    setDiary((p) => [...p, newEntry]);
  };

  const removeEntry = async (index: number) => {
    const entry = diary[index];
    if (!entry) return;
    if (entry.id != null) {
      try {
        const database = await getDb();
        await database.runAsync('DELETE FROM nutrition WHERE id = ?', [entry.id]);
      } catch (e) {
        console.warn('Failed to delete entry from DB', e);
      }
    }
    setDiary((p) => p.filter((_, i) => i !== index));
  };

  return (
    <DiaryContext.Provider value={{ diary, addEntry, removeEntry }}>{children}</DiaryContext.Provider>
  );
}

export function useDiary() {
  const ctx = useContext(DiaryContext);
  if (!ctx) throw new Error('useDiary must be used within DiaryProvider');
  return ctx;
}

export type { Nutrition };
