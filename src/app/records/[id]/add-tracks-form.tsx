"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type TrackInput = {
  side: "A" | "B";
  position: number;
  title: string;
  genre: string;
  vocals: boolean;
  when_to_play: string;
  description: string;
};

function emptyTrack(side: "A" | "B", position: number): TrackInput {
  return {
    side,
    position,
    title: "",
    genre: "",
    vocals: false,
    when_to_play: "",
    description: "",
  };
}

export function AddTracksForm({
  recordId,
  nextPositionA,
  nextPositionB,
}: {
  recordId: number;
  nextPositionA: number;
  nextPositionB: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tracks, setTracks] = useState<TrackInput[]>([
    emptyTrack("A", nextPositionA),
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateTrack = (index: number, patch: Partial<TrackInput>) => {
    setTracks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, ...patch } : t))
    );
  };

  const nextPosForSide = (side: "A" | "B"): number => {
    const base = side === "A" ? nextPositionA : nextPositionB;
    const sameSideDraft = tracks.filter((t) => t.side === side);
    if (sameSideDraft.length === 0) return base;
    return Math.max(base, ...sameSideDraft.map((t) => t.position)) + 1;
  };

  const addTrack = (side: "A" | "B") => {
    setTracks((prev) => [...prev, emptyTrack(side, nextPosForSide(side))]);
  };

  const removeTrack = (index: number) => {
    setTracks((prev) => prev.filter((_, i) => i !== index));
  };

  const reset = () => {
    setTracks([emptyTrack("A", nextPositionA)]);
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = tracks
        .filter((t) => t.title.trim())
        .map((t) => ({
          side: t.side,
          position: t.position,
          title: t.title.trim(),
          genre: t.genre.trim() || null,
          vocals: t.vocals,
          when_to_play: t.when_to_play.trim() || null,
          description: t.description.trim() || null,
        }));
      if (payload.length === 0) {
        throw new Error("Add at least one track with a title");
      }
      const res = await fetch(`/api/records/${recordId}/tracks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tracks: payload }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to save");
      }
      setOpen(false);
      reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900"
      >
        + Add more tracks
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3 border border-zinc-300 dark:border-zinc-700 rounded-md p-4 bg-white dark:bg-zinc-950"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Add tracks to this record</h3>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            reset();
          }}
          className="text-xs text-zinc-500 hover:underline"
        >
          Cancel
        </button>
      </div>

      {tracks.map((t, i) => (
        <div
          key={i}
          className="border border-zinc-200 dark:border-zinc-800 rounded-md p-3 space-y-2"
        >
          <div className="flex items-center gap-2">
            <select
              value={t.side}
              onChange={(e) =>
                updateTrack(i, { side: e.target.value as "A" | "B" })
              }
              className={`${inputClass} w-16`}
            >
              <option value="A">A</option>
              <option value="B">B</option>
            </select>
            <input
              type="number"
              min={1}
              value={t.position}
              onChange={(e) =>
                updateTrack(i, { position: Number(e.target.value) })
              }
              className={`${inputClass} w-16`}
            />
            <input
              placeholder="Track title"
              value={t.title}
              onChange={(e) => updateTrack(i, { title: e.target.value })}
              className={`${inputClass} flex-1`}
            />
            <button
              type="button"
              onClick={() => removeTrack(i)}
              className="text-red-500 text-sm px-2"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input
              placeholder="Genre"
              value={t.genre}
              onChange={(e) => updateTrack(i, { genre: e.target.value })}
              className={inputClass}
            />
            <label className="flex items-center gap-2 text-sm px-2">
              <input
                type="checkbox"
                checked={t.vocals}
                onChange={(e) => updateTrack(i, { vocals: e.target.checked })}
              />
              Has vocals
            </label>
            <input
              placeholder="When to play (e.g., late night)"
              value={t.when_to_play}
              onChange={(e) =>
                updateTrack(i, { when_to_play: e.target.value })
              }
              className={inputClass}
            />
          </div>
          <textarea
            placeholder="Description / notes"
            value={t.description}
            onChange={(e) => updateTrack(i, { description: e.target.value })}
            className={`${inputClass} w-full min-h-[60px]`}
          />
        </div>
      ))}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => addTrack("A")}
          className="text-sm px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-md"
        >
          + Track on Side A
        </button>
        <button
          type="button"
          onClick={() => addTrack("B")}
          className="text-sm px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-md"
        >
          + Track on Side B
        </button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save tracks"}
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-md text-sm bg-white dark:bg-zinc-900";
