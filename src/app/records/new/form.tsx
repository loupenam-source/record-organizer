"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { YoutubeNotes } from "../youtube-notes";

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

type DiscogsImportResponse = {
  artist: string;
  album: string;
  year: number | null;
  tracks: { side: "A" | "B"; position: number; title: string }[];
};

export function NewRecordForm() {
  const router = useRouter();
  const [artist, setArtist] = useState("");
  const [album, setAlbum] = useState("");
  const [year, setYear] = useState("");
  const [tracks, setTracks] = useState<TrackInput[]>([emptyTrack("A", 1)]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discogsUrl, setDiscogsUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const importFromDiscogs = async () => {
    if (!discogsUrl.trim()) return;
    setImporting(true);
    setImportError(null);
    try {
      const res = await fetch(
        `/api/discogs/release?url=${encodeURIComponent(discogsUrl.trim())}`
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Import failed");
      }
      const d = data as DiscogsImportResponse;
      setArtist(d.artist);
      setAlbum(d.album);
      setYear(d.year ? String(d.year) : "");
      if (d.tracks.length > 0) {
        setTracks(
          d.tracks.map((t) => ({
            ...emptyTrack(t.side, t.position),
            title: t.title,
          }))
        );
      }
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const updateTrack = (index: number, patch: Partial<TrackInput>) => {
    setTracks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, ...patch } : t))
    );
  };

  const addTrack = (side: "A" | "B") => {
    const sameSide = tracks.filter((t) => t.side === side);
    const nextPos = sameSide.length === 0 ? 1 : Math.max(...sameSide.map((t) => t.position)) + 1;
    setTracks((prev) => [...prev, emptyTrack(side, nextPos)]);
  };

  const removeTrack = (index: number) => {
    setTracks((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artist: artist.trim(),
          album: album.trim(),
          year: year ? Number(year) : null,
          tracks: tracks
            .filter((t) => t.title.trim())
            .map((t) => ({
              side: t.side,
              position: t.position,
              title: t.title.trim(),
              genre: t.genre.trim() || null,
              vocals: t.vocals,
              when_to_play: t.when_to_play.trim() || null,
              description: t.description.trim() || null,
            })),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to save");
      }
      const { id } = await res.json();
      router.push(`/records/${id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-md p-3 bg-white dark:bg-zinc-950 space-y-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Import from Discogs
          </span>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://www.discogs.com/release/249504-..."
              value={discogsUrl}
              onChange={(e) => setDiscogsUrl(e.target.value)}
              className={`${inputClass} flex-1`}
            />
            <button
              type="button"
              onClick={importFromDiscogs}
              disabled={importing || !discogsUrl.trim()}
              className="text-sm px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-md disabled:opacity-50"
            >
              {importing ? "Importing..." : "Import"}
            </button>
          </div>
        </label>
        {importError && <p className="text-red-500 text-sm">{importError}</p>}
        <p className="text-xs text-zinc-500">
          Paste a Discogs release URL to pre-fill artist, album, year, and tracks.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Field label="Artist">
          <input
            required
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Album / EP">
          <input
            required
            value={album}
            onChange={(e) => setAlbum(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Year">
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-sm">Tracks</h2>
        {tracks.map((t, i) => (
          <div
            key={i}
            className="border border-zinc-200 dark:border-zinc-800 rounded-md p-3 bg-white dark:bg-zinc-950 space-y-2"
          >
            <div className="flex items-center gap-2">
              <select
                value={t.side}
                onChange={(e) => updateTrack(i, { side: e.target.value as "A" | "B" })}
                className={`${inputClass} w-16`}
              >
                <option value="A">A</option>
                <option value="B">B</option>
              </select>
              <input
                type="number"
                min={1}
                value={t.position}
                onChange={(e) => updateTrack(i, { position: Number(e.target.value) })}
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
                onChange={(e) => updateTrack(i, { when_to_play: e.target.value })}
                className={inputClass}
              />
            </div>
            <textarea
              placeholder="Description / notes"
              value={t.description}
              onChange={(e) => updateTrack(i, { description: e.target.value })}
              className={`${inputClass} w-full min-h-[60px]`}
            />
            <YoutubeNotes
              trackTitle={t.title}
              onResult={(n) =>
                updateTrack(i, {
                  title: t.title.trim() || n.title,
                  genre: n.genre,
                  vocals: n.vocals,
                  when_to_play: n.when_to_play,
                  description: n.description,
                })
              }
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
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Record"}
        </button>
        <Link
          href="/"
          className="px-4 py-2 rounded-md text-sm border border-zinc-300 dark:border-zinc-700"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

const inputClass =
  "px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-md text-sm bg-white dark:bg-zinc-900";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {label}
      </span>
      {children}
    </label>
  );
}
