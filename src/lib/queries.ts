import {
  ensureSchema,
  getSql,
  type RecordRow,
  type TrackRow,
  type TrackWithRecord,
} from "./db";

export async function listRecords(userId: number): Promise<RecordRow[]> {
  await ensureSchema();
  const rows = await getSql()`
    SELECT * FROM records WHERE user_id = ${userId} ORDER BY created_at DESC
  `;
  return rows as RecordRow[];
}

export async function getRecord(id: number): Promise<RecordRow | undefined> {
  await ensureSchema();
  const rows = await getSql()`SELECT * FROM records WHERE id = ${id}`;
  return (rows[0] as RecordRow | undefined) ?? undefined;
}

export async function getTracksForRecord(recordId: number): Promise<TrackRow[]> {
  await ensureSchema();
  const rows = await getSql()`
    SELECT * FROM tracks WHERE record_id = ${recordId}
    ORDER BY side, position
  `;
  return rows as TrackRow[];
}

export async function listAllTracks(userId: number): Promise<TrackWithRecord[]> {
  await ensureSchema();
  const rows = await getSql()`
    SELECT t.*, r.artist, r.album, r.created_at AS record_created_at
    FROM tracks t
    JOIN records r ON r.id = t.record_id
    WHERE r.user_id = ${userId}
    ORDER BY r.artist, r.album, t.side, t.position
  `;
  return rows as TrackWithRecord[];
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

export async function createRecordWithTracks(
  userId: number,
  input: NewRecord
): Promise<number> {
  await ensureSchema();
  const sql = getSql();
  const recRows = await sql`
    INSERT INTO records (user_id, artist, album, year)
    VALUES (${userId}, ${input.artist}, ${input.album}, ${input.year ?? null})
    RETURNING id
  `;
  const recordId = Number((recRows[0] as { id: number }).id);
  for (const t of input.tracks) {
    await sql`
      INSERT INTO tracks
        (record_id, side, position, title, genre, vocals, when_to_play, description)
      VALUES
        (${recordId}, ${t.side}, ${t.position}, ${t.title},
         ${t.genre ?? null}, ${t.vocals}, ${t.when_to_play ?? null},
         ${t.description ?? null})
    `;
  }
  return recordId;
}

export async function addTracksToRecord(
  recordId: number,
  tracks: NewTrack[]
): Promise<void> {
  await ensureSchema();
  const sql = getSql();
  for (const t of tracks) {
    await sql`
      INSERT INTO tracks
        (record_id, side, position, title, genre, vocals, when_to_play, description)
      VALUES
        (${recordId}, ${t.side}, ${t.position}, ${t.title},
         ${t.genre ?? null}, ${t.vocals}, ${t.when_to_play ?? null},
         ${t.description ?? null})
    `;
  }
}

export async function getTrackOwnerUserId(trackId: number): Promise<number | null> {
  await ensureSchema();
  const rows = await getSql()`
    SELECT r.user_id FROM tracks t
    JOIN records r ON r.id = t.record_id
    WHERE t.id = ${trackId}
  `;
  const row = rows[0] as { user_id: number } | undefined;
  return row ? row.user_id : null;
}

export async function getNextPosition(
  recordId: number,
  side: "A" | "B"
): Promise<number> {
  await ensureSchema();
  const rows = await getSql()`
    SELECT COALESCE(MAX(position), 0) AS max_pos
    FROM tracks WHERE record_id = ${recordId} AND side = ${side}
  `;
  const maxPos = Number((rows[0] as { max_pos: number | string }).max_pos);
  return maxPos + 1;
}

const UPDATABLE_TRACK_FIELDS = [
  "side",
  "position",
  "title",
  "genre",
  "vocals",
  "when_to_play",
  "description",
] as const;

type UpdatableField = (typeof UPDATABLE_TRACK_FIELDS)[number];

export async function updateTrack(
  id: number,
  patch: Partial<Pick<TrackRow, UpdatableField>>
): Promise<void> {
  await ensureSchema();
  const sql = getSql();
  for (const key of UPDATABLE_TRACK_FIELDS) {
    if (!(key in patch)) continue;
    const value = patch[key] ?? null;
    // column name is whitelisted above, so interpolation is safe
    switch (key) {
      case "side":
        await sql`UPDATE tracks SET side = ${value} WHERE id = ${id}`;
        break;
      case "position":
        await sql`UPDATE tracks SET position = ${value} WHERE id = ${id}`;
        break;
      case "title":
        await sql`UPDATE tracks SET title = ${value} WHERE id = ${id}`;
        break;
      case "genre":
        await sql`UPDATE tracks SET genre = ${value} WHERE id = ${id}`;
        break;
      case "vocals":
        await sql`UPDATE tracks SET vocals = ${value} WHERE id = ${id}`;
        break;
      case "when_to_play":
        await sql`UPDATE tracks SET when_to_play = ${value} WHERE id = ${id}`;
        break;
      case "description":
        await sql`UPDATE tracks SET description = ${value} WHERE id = ${id}`;
        break;
    }
  }
}

export async function deleteRecord(id: number): Promise<void> {
  await ensureSchema();
  await getSql()`DELETE FROM records WHERE id = ${id}`;
}

export async function deleteTrack(id: number): Promise<void> {
  await ensureSchema();
  await getSql()`DELETE FROM tracks WHERE id = ${id}`;
}
