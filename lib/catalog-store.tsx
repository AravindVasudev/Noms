import * as SQLite from 'expo-sqlite';

type CatalogRow = {
  id: number;
  name: string;
  calories: number | null;
  fat: number | null;
  protein: number | null;
  carbs: number | null;
  fiber: number | null;
};

class CatalogStore {
  private _db: any = null;
  constructor() {}

  private async getDb() {
    if (!this._db) this._db = await SQLite.openDatabaseAsync('diary.db');
    return this._db;
  }

  async init() {
    const db = await this.getDb();
    await db.execAsync(
      `CREATE TABLE IF NOT EXISTS catalog (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      calories REAL,
      fat REAL,
      protein REAL,
      carbs REAL,
      fiber REAL
    )`
    );
  }

  async getAllEntries(): Promise<CatalogRow[]> {
    const db = await this.getDb();
    const rows: any[] = await db.getAllAsync('SELECT * FROM catalog ORDER BY id ASC');
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      calories: r.calories == null ? null : Number(r.calories),
      fat: r.fat == null ? null : Number(r.fat),
      protein: r.protein == null ? null : Number(r.protein),
      carbs: r.carbs == null ? null : Number(r.carbs),
      fiber: r.fiber == null ? null : Number(r.fiber),
    }));
  }

  async insertEntry(entry: Omit<CatalogRow, 'id'>): Promise<number> {
    const params = [
      entry.name,
      entry.calories,
      entry.fat,
      entry.protein,
      entry.carbs,
      entry.fiber,
    ];
    const db = await this.getDb();
    const res = await db.runAsync(
      'INSERT INTO catalog (name, calories, fat, protein, carbs, fiber) VALUES (?, ?, ?, ?, ?, ?)',
      params
    );
    return res.lastInsertRowId;
  }

  async deleteEntryById(id: number): Promise<void> {
    const db = await this.getDb();
    await db.runAsync('DELETE FROM catalog WHERE id = ?', [id]);
  }

  async dropTable(): Promise<void> {
    const db = await this.getDb();
    await db.execAsync('DROP TABLE IF EXISTS catalog');
  }
}

const catalogStore = new CatalogStore();

export default catalogStore;
export type { CatalogRow };
