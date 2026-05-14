import Link from "next/link";
import { redirect } from "next/navigation";
import { listAllTracks, listRecords } from "@/lib/queries";
import { getCurrentUser, getUserByUsername, listUsers } from "@/lib/auth";
import { TracksTable } from "./tracks-table";
import { UserSwitcher } from "./user-switcher";
import { SignOutButton } from "./sign-out-button";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ user?: string }>;
}) {
  const current = await getCurrentUser();
  if (!current) redirect("/signin");

  const { user: viewingUsername } = await searchParams;
  const viewing =
    viewingUsername && viewingUsername !== current.username
      ? await getUserByUsername(viewingUsername)
      : current;
  if (!viewing) redirect("/");

  const isOwn = viewing.id === current.id;
  const [tracks, records, allUsers] = await Promise.all([
    listAllTracks(viewing.id),
    listRecords(viewing.id),
    listUsers(),
  ]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 py-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">
            {isOwn ? "Record Organizer" : `${viewing.name}'s Collection`}
          </h1>
          <p className="text-xs text-zinc-500">
            {records.length} record{records.length === 1 ? "" : "s"} ·{" "}
            {tracks.length} track{tracks.length === 1 ? "" : "s"}
            {isOwn ? "" : " · read only"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <UserSwitcher
            users={allUsers.map((u) => ({ username: u.username, name: u.name }))}
            currentUsername={current.username}
            viewingUsername={viewing.username}
          />
          {isOwn ? (
            <Link
              href="/records/new"
              className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-md text-sm font-medium hover:opacity-90"
            >
              + Add Record
            </Link>
          ) : null}
          <SignOutButton />
        </div>
      </header>

      <main className="p-6">
        {tracks.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            {isOwn ? (
              <>
                <p className="mb-4">No records yet.</p>
                <Link href="/records/new" className="text-blue-600 underline">
                  Add your first record →
                </Link>
              </>
            ) : (
              <p>{viewing.name} hasn&apos;t added any records yet.</p>
            )}
          </div>
        ) : (
          <TracksTable tracks={tracks} />
        )}
      </main>
    </div>
  );
}
