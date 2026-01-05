import React, { createContext, ReactNode, useContext, useState } from 'react';

type Nutrition = {
  name: string;
  calories: string;
  fat: string;
  protein: string;
  carbs: string;
  fiber: string;
};

type DiaryContextValue = {
  diary: Nutrition[];
  addEntry: (entry: Nutrition) => void;
  removeEntry: (index: number) => void;
};

const DiaryContext = createContext<DiaryContextValue | undefined>(undefined);

export function DiaryProvider({ children }: { children: ReactNode }) {
  const [diary, setDiary] = useState<Nutrition[]>([]);

  const addEntry = (entry: Nutrition) => {
    setDiary((p) => [...p, entry]);
  };

  const removeEntry = (index: number) => {
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
