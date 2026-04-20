import { NextResponse } from "next/server";
import { deleteTrack, updateTrack } from "@/lib/queries";
import type { TrackRow } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const patch = (await req.json()) as Partial<TrackRow>;
  await updateTrack(Number(id), patch);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deleteTrack(Number(id));
  return NextResponse.json({ ok: true });
}
