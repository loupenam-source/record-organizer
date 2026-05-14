import { NextResponse } from "next/server";
import { deleteTrack, getTrackOwnerUserId, updateTrack } from "@/lib/queries";
import type { TrackRow } from "@/lib/db";
import { requireUserOr401 } from "@/lib/auth";

async function authorizeTrack(trackId: number, userId: number) {
  const ownerId = await getTrackOwnerUserId(trackId);
  if (ownerId === null) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (ownerId !== userId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return null;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUserOr401();
  if (auth.response) return auth.response;
  const { id } = await params;
  const trackId = Number(id);
  const denied = await authorizeTrack(trackId, auth.user.id);
  if (denied) return denied;
  const patch = (await req.json()) as Partial<TrackRow>;
  await updateTrack(trackId, patch);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUserOr401();
  if (auth.response) return auth.response;
  const { id } = await params;
  const trackId = Number(id);
  const denied = await authorizeTrack(trackId, auth.user.id);
  if (denied) return denied;
  await deleteTrack(trackId);
  return NextResponse.json({ ok: true });
}
