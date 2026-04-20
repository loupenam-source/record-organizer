import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

type Sql = NeonQueryFunction<false, false>;

let _sql: Sql | null = null;
let _initialized = false;

export function getSql(): Sql {
  if (_sql) return _sql;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. For local dev, run `vercel env pull .env.development.local`."
    );
  }
  _sql = neon(url);
  return _sql;
}

export async function ensureSchema(): Promise<void> {
  if (_initialized) return;
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS records (
      id SERIAL PRIMARY KEY,
      artist TEXT NOT NULL,
      album TEXT NOT NULL,
      year INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS tracks (
      id SERIAL PRIMARY KEY,
      record_id INTEGER NOT NULL REFERENCES records(id) ON DELETE CASCADE,
      side TEXT NOT NULL CHECK (side IN ('A','B')),
      position INTEGER NOT NULL,
      title TEXT NOT NULL,
      genre TEXT,
      vocals BOOLEAN NOT NULL DEFAULT FALSE,
      when_to_play TEXT,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (record_id, side, position)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_tracks_record ON tracks(record_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_tracks_genre ON tracks(genre)`;
  _initialized = true;
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
  vocals: boolean;
  when_to_play: string | null;
  description: string | null;
  created_at: string;
};

export type TrackWithRecord = TrackRow & {
  artist: string;
  album: string;
};
