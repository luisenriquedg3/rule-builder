import Database from "better-sqlite3";

export function createDb(path = process.env.DB_PATH ?? "rules.db") {
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS rules (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL UNIQUE COLLATE NOCASE,
      enabled     INTEGER NOT NULL DEFAULT 1,
      trigger     TEXT NOT NULL,
      match_mode  TEXT NOT NULL CHECK (match_mode IN ('all','any')),
      conditions  TEXT NOT NULL,   -- JSON
      actions     TEXT NOT NULL,   -- JSON
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}
export type Db = ReturnType<typeof createDb>;