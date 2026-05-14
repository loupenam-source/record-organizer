import { NextResponse } from "next/server";
import { listAllTracks } from "@/lib/queries";
import { requireUserOr401 } from "@/lib/auth";

export async function GET() {
  const auth = await requireUserOr401();
  if (auth.response) return auth.response;
  return NextResponse.json(await listAllTracks(auth.user.id));
}
