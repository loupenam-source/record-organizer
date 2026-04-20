import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getRecord, getTracksForRecord } from "@/lib/queries";
import { LabelDocument } from "@/lib/label-pdf";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const recordId = Number(id);
  const record = await getRecord(recordId);
  if (!record) return NextResponse.json({ error: "not found" }, { status: 404 });
  const tracks = await getTracksForRecord(recordId);

  const buffer = await renderToBuffer(LabelDocument({ record, tracks }));
  const filename = `${record.artist} - ${record.album}.pdf`.replace(/[^\w\-. ]/g, "_");

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
}
