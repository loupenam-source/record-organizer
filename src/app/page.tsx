import Link from "next/link";
import { listAllTracks, listRecords } from "@/lib/queries";
import { TracksTable } from "./tracks-table";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [tracks, records] = await Promise.all([
    listAllTracks(),
    listRecords(),
  ]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Record Organizer</h1>
          <p className="text-xs text-zinc-500">
            {records.length} record{records.length === 1 ? "" : "s"} ·{" "}
            {tracks.length} track{tracks.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          href="/records/new"
          className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-md text-sm font-medium hover:opacity-90"
        >
          + Add Record
        </Link>
      </header>

      <main className="p-6">
        {tracks.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <p className="mb-4">No records yet.</p>
            <Link
              href="/records/new"
              className="text-blue-600 underline"
            >
              Add your first record →
            </Link>
          </div>
        ) : (
          <TracksTable tracks={tracks} />
        )}
      </main>
    </div>
  );
}
