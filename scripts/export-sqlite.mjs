// Export existing SQLite data.db to JSON for migration to Postgres.
// Usage: node scripts/export-sqlite.mjs > backup.json
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "..", "data.db");

function query(sql) {
  const out = execFileSync(
    "sqlite3",
    [dbPath, "-json", sql],
    { encoding: "utf8" }
  );
  return out.trim() ? JSON.parse(out) : [];
}

const records = query("SELECT id, artist, album, year, created_at FROM records ORDER BY id");
const tracks = query(
  "SELECT id, record_id, side, position, title, genre, vocals, when_to_play, description, created_at FROM tracks ORDER BY id"
);

console.log(JSON.stringify({ records, tracks }, null, 2));
console.error(
  `Exported ${records.length} records, ${tracks.length} tracks from ${dbPath}`
);
