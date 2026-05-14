import { NextResponse } from "next/server";
import {
  addTracksToRecord,
  getRecord,
  type NewTrack,
} from "@/lib/queries";
import { requireUserOr401 } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUserOr401();
  if (auth.response) return auth.response;
  const { id } = await params;
  const recordId = Number(id);
  const record = await getRecord(recordId);
  if (!record) {
    return NextResponse.json({ error: "record not found" }, { status: 404 });
  }
  if (record.user_id !== auth.user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
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
