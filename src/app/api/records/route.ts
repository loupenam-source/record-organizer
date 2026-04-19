import { NextResponse } from "next/server";
import { createRecordWithTracks, listRecords, type NewRecord } from "@/lib/queries";

export async function GET() {
  return NextResponse.json(listRecords());
}

export async function POST(req: Request) {
  const body = (await req.json()) as NewRecord;
  if (!body.artist || !body.album || !Array.isArray(body.tracks)) {
    return NextResponse.json({ error: "artist, album, tracks required" }, { status: 400 });
  }
  const id = createRecordWithTracks(body);
  return NextResponse.json({ id }, { status: 201 });
}
