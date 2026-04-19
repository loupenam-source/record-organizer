import { getDb, type RecordRow, type TrackRow, type TrackWithRecord } from "./db";

export function listRecords(): RecordRow[] {
  return getDb()
    .prepare("SELECT * FROM records ORDER BY created_at DESC")
    .all() as RecordRow[];
}

export function getRecord(id: number): RecordRow | undefined {
  return getDb()
    .prepare("SELECT * FROM records WHERE id = ?")
    .get(id) as RecordRow | undefined;
}

export function getTracksForRecord(recordId: number): TrackRow[] {
  return getDb()
    .prepare(
      "SELECT * FROM tracks WHERE record_id = ? ORDER BY side, position"
    )
    .all(recordId) as TrackRow[];
}

export function listAllTracks(): TrackWithRecord[] {
  return getDb()
    .prepare(
      `SELECT t.*, r.artist, r.album
       FROM tracks t
       JOIN records r ON r.id = t.record_id
       ORDER BY r.artist, r.album, t.side, t.position`
    )
    .all() as TrackWithRecord[];
}

export type NewTrack = {
  side: "A" | "B";
  position: number;
  title: string;
  genre?: string | null;
  vocals: boolean;
  when_to_play?: string | null;
  description?: string | null;
};

export type NewRecord = {
  artist: string;
  album: string;
  year?: number | null;
  tracks: NewTrack[];
};

export function createRecordWithTracks(input: NewRecord): number {
  const db = getDb();
  const tx = db.transaction((data: NewRecord) => {
    const recordResult = db
      .prepare(
        "INSERT INTO records (artist, album, year) VALUES (?, ?, ?)"
      )
      .run(data.artist, data.album, data.year ?? null);
    const recordId = Number(recordResult.lastInsertRowid);
    const insertTrack = db.prepare(
      `INSERT INTO tracks (record_id, side, position, title, genre, vocals, when_to_play, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const t of data.tracks) {
      insertTrack.run(
        recordId,
        t.side,
        t.position,
        t.title,
        t.genre ?? null,
        t.vocals ? 1 : 0,
        t.when_to_play ?? null,
        t.description ?? null
      );
    }
    return recordId;
  });
  return tx(input);
}

export function updateTrack(
  id: number,
  patch: Partial<Omit<TrackRow, "id" | "record_id" | "created_at">>
): void {
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [key, value] of Object.entries(patch)) {
    fields.push(`${key} = ?`);
    values.push(value);
  }
  if (fields.length === 0) return;
  values.push(id);
  getDb()
    .prepare(`UPDATE tracks SET ${fields.join(", ")} WHERE id = ?`)
    .run(...values);
}

export function deleteRecord(id: number): void {
  getDb().prepare("DELETE FROM records WHERE id = ?").run(id);
}
