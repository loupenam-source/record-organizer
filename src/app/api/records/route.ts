import { NextResponse } from "next/server";
import { createRecordWithTracks, listRecords, type NewRecord } from "@/lib/queries";
import { requireUserOr401 } from "@/lib/auth";

export async function GET() {
  const auth = await requireUserOr401();
  if (auth.response) return auth.response;
  return NextResponse.json(await listRecords(auth.user.id));
}

export async function POST(req: Request) {
  const auth = await requireUserOr401();
  if (auth.response) return auth.response;
  const body = (await req.json()) as NewRecord;
  if (!body.artist || !body.album || !Array.isArray(body.tracks)) {
    return NextResponse.json({ error: "artist, album, tracks required" }, { status: 400 });
  }
  const id = await createRecordWithTracks(auth.user.id, body);
  return NextResponse.json({ id }, { status: 201 });
}
