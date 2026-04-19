import { NextResponse } from "next/server";
import { listAllTracks } from "@/lib/queries";

export async function GET() {
  return NextResponse.json(listAllTracks());
}
