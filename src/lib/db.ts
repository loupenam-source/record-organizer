import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

type Sql = NeonQueryFunction<false, false>;

let _sql: Sql | null = null;
let _initialized = false;

export function getSql(): Sql {
  if (_sql) return _sql;
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL / POSTGRES_URL is not set. For local dev, run `vercel env pull .env.development.local`."
    );
  }
  _sql = neon(url);
  return _sql;
}

export async function ensureSchema(): Promise<void> {
  if (_initialized) return;
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
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

  await seedUsers(sql);
  await addUserIdToRecords(sql);

  _initialized = true;
}

type UserConfig = { username: string; name: string; passcode: string };

function readUserConfig(): UserConfig[] {
  const raw = process.env.USERS_JSON;
  if (!raw) {
    throw new Error(
      "USERS_JSON is not set. Define users in your .env, e.g. " +
        `USERS_JSON='[{"username":"lou","name":"Lou","passcode":"changeme"}]'`
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("USERS_JSON is not valid JSON");
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("USERS_JSON must be a non-empty array");
  }
  for (const u of parsed) {
    if (
      !u ||
      typeof u !== "object" ||
      typeof (u as UserConfig).username !== "string" ||
      typeof (u as UserConfig).name !== "string" ||
      typeof (u as UserConfig).passcode !== "string"
    ) {
      throw new Error(
        "Each USERS_JSON entry needs string username, name, and passcode"
      );
    }
  }
  return parsed as UserConfig[];
}

export function getUserConfig(): UserConfig[] {
  return readUserConfig();
}

async function seedUsers(sql: Sql): Promise<void> {
  const users = readUserConfig();
  for (const u of users) {
    await sql`
      INSERT INTO users (username, name)
      VALUES (${u.username}, ${u.name})
      ON CONFLICT (username) DO UPDATE SET name = EXCLUDED.name
    `;
  }
}

async function addUserIdToRecords(sql: Sql): Promise<void> {
  await sql`ALTER TABLE records ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)`;
  const rows = await sql`SELECT id FROM users WHERE username = 'lou'`;
  const lou = rows[0] as { id: number } | undefined;
  if (lou) {
    await sql`UPDATE records SET user_id = ${lou.id} WHERE user_id IS NULL`;
  }
  await sql`ALTER TABLE records ALTER COLUMN user_id SET NOT NULL`;
  await sql`CREATE INDEX IF NOT EXISTS idx_records_user ON records(user_id)`;
}

export type UserRow = {
  id: number;
  username: string;
  name: string;
  created_at: string;
};

export type RecordRow = {
  id: number;
  user_id: number;
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
  record_created_at: string;
};
