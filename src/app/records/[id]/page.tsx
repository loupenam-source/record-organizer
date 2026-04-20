import Link from "next/link";
import { notFound } from "next/navigation";
import { getNextPosition, getRecord, getTracksForRecord } from "@/lib/queries";
import { AddTracksForm } from "./add-tracks-form";
import { TrackCard } from "./track-card";

export const dynamic = "force-dynamic";

export default async function RecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recordId = Number(id);
  const record = await getRecord(recordId);
  if (!record) notFound();
  const [tracks, nextPositionA, nextPositionB] = await Promise.all([
    getTracksForRecord(recordId),
    getNextPosition(recordId, "A"),
    getNextPosition(recordId, "B"),
  ]);
  const sideA = tracks.filter((t) => t.side === "A");
  const sideB = tracks.filter((t) => t.side === "B");

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 py-4 flex items-center justify-between">
        <div>
          <Link href="/" className="text-xs text-zinc-500 hover:underline">
            ← Back
          </Link>
          <h1 className="text-xl font-bold">
            {record.artist} — {record.album}
          </h1>
          {record.year ? (
            <p className="text-xs text-zinc-500">{record.year}</p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/records/${record.id}/label`}
            target="_blank"
            rel="noreferrer"
            className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-md text-sm font-medium hover:opacity-90"
          >
            Generate Label (PDF)
          </a>
        </div>
      </header>

      <main className="p-6 max-w-3xl space-y-6">
        {[{ side: "A", tracks: sideA }, { side: "B", tracks: sideB }].map(
          ({ side, tracks: t }) =>
            t.length > 0 ? (
              <section key={side}>
                <h2 className="font-bold text-sm mb-2">SIDE {side}</h2>
                <div className="space-y-2">
                  {t.map((tr) => (
                    <TrackCard key={tr.id} track={tr} />
                  ))}
                </div>
              </section>
            ) : null
        )}

        <AddTracksForm
          recordId={record.id}
          nextPositionA={nextPositionA}
          nextPositionB={nextPositionB}
        />
      </main>
    </div>
  );
}
