import * as SQLite from 'expo-sqlite';

type NutritionRow = {
  id: number;
  name: string;
  calories: number | null;
  fat: number | null;
  protein: number | null;
  carbs: number | null;
  fiber: number | null;
  date: Date;
};

class DB {
  private _db: any = null;
  constructor() {}

  private async getDb() {
    if (!this._db) this._db = await SQLite.openDatabaseAsync('diary.db');
    return this._db;
  }

  async init() {
    const db = await this.getDb();
    await db.execAsync(
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
  }

  async getAllEntries(): Promise<NutritionRow[]> {
    const db = await this.getDb();
    const res: any = await db.getAllAsync('SELECT * FROM nutrition ORDER BY id ASC');
    const rows: any[] = (res && res.rows && res.rows._array) || [];
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      calories: r.calories == null ? null : Number(r.calories),
      fat: r.fat == null ? null : Number(r.fat),
      protein: r.protein == null ? null : Number(r.protein),
      carbs: r.carbs == null ? null : Number(r.carbs),
      fiber: r.fiber == null ? null : Number(r.fiber),
      date: new Date(r.date),
    }));
  }

  async insertEntry(entry: Omit<NutritionRow, 'id'>): Promise<number | undefined> {
    const params = [
      entry.name,
      entry.calories,
      entry.fat,
      entry.protein,
      entry.carbs,
      entry.fiber,
      entry.date.toISOString(),
    ];
    const db = await this.getDb();
    const res: any = await db.runAsync(
      'INSERT INTO nutrition (name, calories, fat, protein, carbs, fiber, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      params
    );
    return res && (res as any).insertId ? (res as any).insertId : undefined;
  }

  async deleteEntryById(id: number): Promise<void> {
    const db = await this.getDb();
    await db.runAsync('DELETE FROM nutrition WHERE id = ?', [id]);
  }
}

const db = new DB();

export default db;
export type { NutritionRow };
