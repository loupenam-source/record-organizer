import { NextResponse } from "next/server";
import { updateTrack } from "@/lib/queries";
import type { TrackRow } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const patch = (await req.json()) as Partial<TrackRow>;
  updateTrack(Number(id), patch);
  return NextResponse.json({ ok: true });
}
