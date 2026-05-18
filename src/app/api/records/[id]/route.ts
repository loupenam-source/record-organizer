import { NextResponse } from "next/server";
import {
  deleteRecord,
  getRecord,
  getTracksForRecord,
  updateRecord,
} from "@/lib/queries";
import type { RecordRow } from "@/lib/db";
import { requireUserOr401 } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUserOr401();
  if (auth.response) return auth.response;
  const { id } = await params;
  const recordId = Number(id);
  const record = await getRecord(recordId);
  if (!record) return NextResponse.json({ error: "not found" }, { status: 404 });
  const tracks = await getTracksForRecord(recordId);
  return NextResponse.json({ record, tracks });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUserOr401();
  if (auth.response) return auth.response;
  const { id } = await params;
  const recordId = Number(id);
  const record = await getRecord(recordId);
  if (!record) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (record.user_id !== auth.user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const patch = (await req.json()) as Partial<RecordRow>;
  await updateRecord(recordId, patch);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUserOr401();
  if (auth.response) return auth.response;
  const { id } = await params;
  const record = await getRecord(Number(id));
  if (!record) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (record.user_id !== auth.user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  await deleteRecord(Number(id));
  return NextResponse.json({ ok: true });
}
