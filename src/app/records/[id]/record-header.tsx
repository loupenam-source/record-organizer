"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { RecordRow } from "@/lib/db";

export function RecordHeader({
  record,
  editable,
}: {
  record: RecordRow;
  editable: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [artist, setArtist] = useState(record.artist);
  const [album, setAlbum] = useState(record.album);
  const [year, setYear] = useState<string>(
    record.year ? String(record.year) : ""
  );

  const openEdit = () => {
    setArtist(record.artist);
    setAlbum(record.album);
    setYear(record.year ? String(record.year) : "");
    setError(null);
    setEditing(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artist.trim() || !album.trim()) {
      setError("Artist and album are required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const yearNum = year.trim() ? Number(year.trim()) : null;
      if (yearNum !== null && !Number.isInteger(yearNum)) {
        throw new Error("Year must be a whole number");
      }
      const res = await fetch(`/api/records/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artist: artist.trim(),
          album: album.trim(),
          year: yearNum,
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
      <form onSubmit={save} className="space-y-2">
        <div className="flex gap-2 flex-wrap">
          <input
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Artist"
            className={`${inputClass} flex-1 min-w-[140px]`}
          />
          <input
            value={album}
            onChange={(e) => setAlbum(e.target.value)}
            placeholder="Album"
            className={`${inputClass} flex-1 min-w-[140px]`}
          />
          <input
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="Year"
            className={`${inputClass} w-24`}
          />
        </div>
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
            onClick={() => {
              setEditing(false);
              setError(null);
            }}
            className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-md text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div>
        <h1 className="text-xl font-bold">
          {record.artist} — {record.album}
        </h1>
        {record.year ? (
          <p className="text-xs text-zinc-500">{record.year}</p>
        ) : null}
      </div>
      {editable ? (
        <button
          type="button"
          onClick={openEdit}
          className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 underline mt-1"
        >
          Edit
        </button>
      ) : null}
    </div>
  );
}

const inputClass =
  "px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-md text-sm bg-white dark:bg-zinc-900";
