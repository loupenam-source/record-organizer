import { NextResponse } from "next/server";
import {
  addTracksToRecord,
  getRecord,
  type NewTrack,
} from "@/lib/queries";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const recordId = Number(id);
  if (!(await getRecord(recordId))) {
    return NextResponse.json({ error: "record not found" }, { status: 404 });
  }
  const body = (await req.json()) as { tracks: NewTrack[] };
  if (!Array.isArray(body.tracks) || body.tracks.length === 0) {
    return NextResponse.json({ error: "tracks required" }, { status: 400 });
  }
  try {
    await addTracksToRecord(recordId, body.tracks);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "insert failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
