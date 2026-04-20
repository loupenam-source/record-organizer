// Import JSON backup (from export-sqlite.mjs) into Postgres.
// Preserves original IDs and created_at timestamps.
// Usage: node scripts/import-postgres.mjs backup.json
// Requires DATABASE_URL env var (load from .env.development.local via --env-file).
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";

const path = process.argv[2];
if (!path) {
  console.error("Usage: node scripts/import-postgres.mjs <backup.json>");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL not set. Run: node --env-file=.env.development.local scripts/import-postgres.mjs backup.json"
  );
  process.exit(1);
}

const data = JSON.parse(readFileSync(path, "utf8"));
const sql = neon(process.env.DATABASE_URL);

// Ensure schema exists.
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

const [existingRecCount] = await sql`SELECT COUNT(*)::int AS n FROM records`;
const [existingTrkCount] = await sql`SELECT COUNT(*)::int AS n FROM tracks`;
if (existingRecCount.n > 0 || existingTrkCount.n > 0) {
  console.error(
    `Refusing to import: target DB already has ${existingRecCount.n} records and ${existingTrkCount.n} tracks. Clear it first or import into a fresh DB.`
  );
  process.exit(1);
}

let recCount = 0;
for (const r of data.records) {
  await sql`
    INSERT INTO records (id, artist, album, year, created_at)
    VALUES (${r.id}, ${r.artist}, ${r.album}, ${r.year ?? null}, ${r.created_at})
  `;
  recCount++;
}

let trkCount = 0;
for (const t of data.tracks) {
  await sql`
    INSERT INTO tracks
      (id, record_id, side, position, title, genre, vocals, when_to_play, description, created_at)
    VALUES
      (${t.id}, ${t.record_id}, ${t.side}, ${t.position}, ${t.title},
       ${t.genre ?? null}, ${t.vocals ? true : false},
       ${t.when_to_play ?? null}, ${t.description ?? null}, ${t.created_at})
  `;
  trkCount++;
}

// Reset SERIAL sequences so future inserts don't collide with imported IDs.
await sql`
  SELECT setval(pg_get_serial_sequence('records', 'id'),
    (SELECT COALESCE(MAX(id), 0) FROM records))
`;
await sql`
  SELECT setval(pg_get_serial_sequence('tracks', 'id'),
    (SELECT COALESCE(MAX(id), 0) FROM tracks))
`;

console.log(`Imported ${recCount} records and ${trkCount} tracks.`);
