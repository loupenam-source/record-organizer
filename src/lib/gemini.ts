import type { TrackRow } from "./db";

export type GeneratedNotes = {
  title: string;
  genre: string;
  vocals: boolean;
  when_to_play: string;
  description: string;
};

const MODEL = "gemini-flash-latest";

const YOUTUBE_HOSTS = new Set([
  "www.youtube.com",
  "youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
]);

// Gemini only accepts the canonical watch URL — share links with extra
// params (?si=, &list=) or other hosts get fetched as HTML and rejected
export function normalizeYoutubeUrl(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (!YOUTUBE_HOSTS.has(url.hostname)) return null;

  let videoId: string | null = null;
  if (url.hostname === "youtu.be") {
    videoId = url.pathname.slice(1).split("/")[0] || null;
  } else if (url.pathname === "/watch") {
    videoId = url.searchParams.get("v");
  } else {
    const match = url.pathname.match(/^\/(?:shorts|embed|live|v)\/([^/?]+)/);
    videoId = match ? match[1] : null;
  }

  if (!videoId || !/^[\w-]{5,20}$/.test(videoId)) return null;
  return `https://www.youtube.com/watch?v=${videoId}`;
}

function formatExample(t: TrackRow): string {
  return [
    `Track: "${t.title}"`,
    `- genre: ${t.genre ?? "unknown"}`,
    `- vocals: ${t.vocals ? "yes" : "instrumental"}`,
    `- when_to_play: ${t.when_to_play ?? ""}`,
    `- description: ${t.description ?? ""}`,
  ].join("\n");
}

function buildPrompt(examples: TrackRow[], trackTitle?: string | null): string {
  const exampleBlock =
    examples.length > 0
      ? `Real examples of the collector's own notes, so you can match his voice:\n\n${examples
          .map(formatExample)
          .join("\n\n")}`
      : "";
  const titleHint = trackTitle?.trim()
    ? `The track is called "${trackTitle.trim()}". Use that as the title.`
    : `Figure out the track title as best you can from the video.`;

  return `You are helping catalog a vinyl record collection. Listen to the linked track and write notes in the collector's personal style.

The collector is a DJ. His notes are short, casual, lowercase-leaning, and focused on how a track feels and where it fits in a DJ set.

${exampleBlock}

${titleHint}

Listen to the audio and return JSON with this exact shape:
{
  "title": "track title",
  "genre": "short genre tag",
  "vocals": true or false (true only if the track has vocals),
  "when_to_play": "where it fits in a set, in his style",
  "description": "2-3 sentences in his voice, mention key moments with rough timestamps (e.g. 'breakdown around 3:20')"
}`;
}

export async function generateTrackNotes(opts: {
  youtubeUrl: string;
  trackTitle?: string | null;
  examples: TrackRow[];
}): Promise<GeneratedNotes> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { file_data: { file_uri: opts.youtubeUrl } },
              { text: buildPrompt(opts.examples, opts.trackTitle) },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          // we only need the audio — low video resolution cuts token
          // usage ~4x, which matters on the free-tier quota
          mediaResolution: "MEDIA_RESOLUTION_LOW",
        },
      }),
    }
  );

  if (res.status === 429) {
    throw new Error(
      "Hit the Gemini free-tier limit — wait a minute and try again (resets daily if it persists)"
    );
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Gemini returned ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Could not parse notes from Gemini response");
  }
  const notes = parsed as Partial<GeneratedNotes>;
  return {
    title: typeof notes.title === "string" ? notes.title : "",
    genre: typeof notes.genre === "string" ? notes.genre : "",
    vocals: Boolean(notes.vocals),
    when_to_play: typeof notes.when_to_play === "string" ? notes.when_to_play : "",
    description: typeof notes.description === "string" ? notes.description : "",
  };
}
