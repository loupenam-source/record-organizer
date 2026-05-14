"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TrackRow } from "@/lib/db";

export function TrackCard({
  track,
  readOnly = false,
}: {
  track: TrackRow;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const onDelete = async () => {
    if (!confirm(`Delete "${track.title}"?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/tracks/${track.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error");
      setDeleting(false);
    }
  };

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-md p-3 bg-white dark:bg-zinc-950 group relative">
      {readOnly ? null : (
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          aria-label="Delete track"
          className="absolute top-2 right-2 text-xs text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 disabled:opacity-50 transition-opacity px-2 py-0.5"
        >
          {deleting ? "..." : "✕"}
        </button>
      )}
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-xs text-zinc-500">
          {track.side}
          {track.position}
        </span>
        <span className="font-semibold">{track.title}</span>
      </div>
      <div className="text-xs text-zinc-500 mt-1 flex gap-2 flex-wrap">
        {track.genre ? <span>{track.genre}</span> : null}
        <span>·</span>
        <span>{track.vocals ? "vocals" : "instrumental"}</span>
        {track.when_to_play ? (
          <>
            <span>·</span>
            <span>{track.when_to_play}</span>
          </>
        ) : null}
      </div>
      {track.description ? (
        <p className="text-sm mt-2 text-zinc-700 dark:text-zinc-300 italic">
          {track.description}
        </p>
      ) : null}
    </div>
  );
}
