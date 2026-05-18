"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TrackRow } from "@/lib/db";

type EditState = {
  side: "A" | "B";
  position: number;
  title: string;
  genre: string;
  vocals: boolean;
  when_to_play: string;
  description: string;
};

function toEditState(track: TrackRow): EditState {
  return {
    side: track.side,
    position: track.position,
    title: track.title,
    genre: track.genre ?? "",
    vocals: track.vocals,
    when_to_play: track.when_to_play ?? "",
    description: track.description ?? "",
  };
}

export function TrackCard({
  track,
  readOnly = false,
}: {
  track: TrackRow;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditState>(() => toEditState(track));

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

  const openEdit = () => {
    setDraft(toEditState(track));
    setError(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setError(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/tracks/${track.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          side: draft.side,
          position: draft.position,
          title: draft.title.trim(),
          genre: draft.genre.trim() || null,
          vocals: draft.vocals,
          when_to_play: draft.when_to_play.trim() || null,
          description: draft.description.trim() || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to save");
      }
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <form
        onSubmit={save}
        className="border border-zinc-300 dark:border-zinc-700 rounded-md p-3 bg-white dark:bg-zinc-950 space-y-2"
      >
        <div className="flex items-center gap-2">
          <select
            value={draft.side}
            onChange={(e) =>
              setDraft({ ...draft, side: e.target.value as "A" | "B" })
            }
            className={`${inputClass} w-16`}
          >
            <option value="A">A</option>
            <option value="B">B</option>
          </select>
          <input
            type="number"
            min={1}
            value={draft.position}
            onChange={(e) =>
              setDraft({ ...draft, position: Number(e.target.value) })
            }
            className={`${inputClass} w-16`}
          />
          <input
            placeholder="Track title"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            className={`${inputClass} flex-1`}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            placeholder="Genre"
            value={draft.genre}
            onChange={(e) => setDraft({ ...draft, genre: e.target.value })}
            className={inputClass}
          />
          <label className="flex items-center gap-2 text-sm px-2">
            <input
              type="checkbox"
              checked={draft.vocals}
              onChange={(e) => setDraft({ ...draft, vocals: e.target.checked })}
            />
            Has vocals
          </label>
          <input
            placeholder="When to play (e.g., late night)"
            value={draft.when_to_play}
            onChange={(e) =>
              setDraft({ ...draft, when_to_play: e.target.value })
            }
            className={inputClass}
          />
        </div>
        <textarea
          placeholder="Description / notes"
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          className={`${inputClass} w-full min-h-[60px]`}
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-3 py-1.5 rounded-md text-sm font-medium disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={cancelEdit}
            className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-md text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-md p-3 bg-white dark:bg-zinc-950 group relative">
      {readOnly ? null : (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={openEdit}
            aria-label="Edit track"
            className="text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 px-2 py-0.5"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            aria-label="Delete track"
            className="text-xs text-zinc-400 hover:text-red-500 disabled:opacity-50 px-2 py-0.5"
          >
            {deleting ? "..." : "✕"}
          </button>
        </div>
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

const inputClass =
  "px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-md text-sm bg-white dark:bg-zinc-900";
