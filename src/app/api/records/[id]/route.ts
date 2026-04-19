import { NextResponse } from "next/server";
import { deleteRecord, getRecord, getTracksForRecord } from "@/lib/queries";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const recordId = Number(id);
  const record = getRecord(recordId);
  if (!record) return NextResponse.json({ error: "not found" }, { status: 404 });
  const tracks = getTracksForRecord(recordId);
  return NextResponse.json({ record, tracks });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  deleteRecord(Number(id));
  return NextResponse.json({ ok: true });
}
