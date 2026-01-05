import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import db from './db';

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

export function DiaryProvider({ children }: { children: ReactNode }) {
  const [diary, setDiary] = useState<Nutrition[]>([]);

  useEffect(() => {
    (async () => {
      try {
        await db.init();
        const rows = await db.getAllEntries();
        setDiary(rows);
      } catch (e) {
        console.warn('Failed to initialize diary DB', e);
      }
    })();
  }, []);

  const addEntry = async (entry: Omit<Nutrition, 'id'>) => {
    const insertId = await db.insertEntry(entry as any);
    const newEntry: Nutrition = { ...(entry as Nutrition) };
    if (insertId != null) newEntry.id = insertId;
    setDiary((p) => [...p, newEntry]);
  };

  const removeEntry = async (index: number) => {
    const entry = diary[index];
    if (!entry) return;
    if (entry.id != null) {
      try {
        await db.deleteEntryById(entry.id);
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
