"use client";

import { useState } from "react";
import type { GeneratedNotes } from "@/lib/gemini";

export function YoutubeNotes({
  trackTitle,
  onResult,
}: {
  trackTitle: string;
  onResult: (notes: GeneratedNotes) => void;
}) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/youtube/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), title: trackTitle }),
      });
      const text = await res.text();
      let j: unknown;
      try {
        j = JSON.parse(text);
      } catch {
        // Vercel returns plain text when the function times out or crashes
        throw new Error(
          res.ok
            ? "Unexpected response from server"
            : `Server error (${res.status}) — try again in a minute`
        );
      }
      if (!res.ok) {
        throw new Error(
          (j as { error?: string }).error ?? "Failed to generate notes"
        );
      }
      onResult(j as GeneratedNotes);
      setUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          placeholder="YouTube link — auto-fill notes by listening"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              generate();
            }
          }}
          disabled={loading}
          className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-md text-sm bg-white dark:bg-zinc-900 flex-1 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={generate}
          disabled={loading || !url.trim()}
          className="text-sm px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? "Listening..." : "Generate notes"}
        </button>
      </div>
      {loading ? (
        <p className="text-xs text-zinc-500 mt-1">
          Listening to the track — this can take up to a minute
        </p>
      ) : null}
      {error ? <p className="text-red-500 text-xs mt-1">{error}</p> : null}
    </div>
  );
}
