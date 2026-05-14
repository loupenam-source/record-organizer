import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { getRecord, getTracksForRecord } from "@/lib/queries";
import { LabelDocument } from "@/lib/label-pdf";
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

  const logo = await readFile(
    path.join(process.cwd(), "public", "fieldtest-logo.png")
  );

  const buffer = await renderToBuffer(LabelDocument({ record, tracks, logo }));
  const filename = `${record.artist} - ${record.album}.pdf`.replace(/[^\w\-. ]/g, "_");

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}
