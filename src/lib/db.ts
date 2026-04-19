import Database from "better-sqlite3";
import path from "node:path";

const dbPath = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      artist TEXT NOT NULL,
      album TEXT NOT NULL,
      year INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tracks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
      side TEXT NOT NULL CHECK (side IN ('A','B')),
      position INTEGER NOT NULL,
      title TEXT NOT NULL,
      genre TEXT,
      vocals INTEGER NOT NULL DEFAULT 0,
      when_to_play TEXT,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (record_id, side, position)
    );

    CREATE INDEX IF NOT EXISTS idx_tracks_record ON tracks(record_id);
    CREATE INDEX IF NOT EXISTS idx_tracks_genre ON tracks(genre);
  `);

  _db = db;
  return db;
}

export type RecordRow = {
  id: number;
  artist: string;
  album: string;
  year: number | null;
  created_at: string;
};

export type TrackRow = {
  id: number;
  record_id: number;
  side: "A" | "B";
  position: number;
  title: string;
  genre: string | null;
  vocals: 0 | 1;
  when_to_play: string | null;
  description: string | null;
  created_at: string;
};

export type TrackWithRecord = TrackRow & {
  artist: string;
  album: string;
};
