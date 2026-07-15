// Ad-hoc test: feed a YouTube link to Gemini and get back track notes
// in Lou's style. Usage:
//   node scripts/test-youtube-notes.mjs "https://www.youtube.com/watch?v=..."
// Requires GEMINI_API_KEY in env or .env.local

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  try {
    const env = readFileSync(join(root, ".env.local"), "utf8");
    const m = env.match(/^GEMINI_API_KEY=(.+)$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  } catch {}
  return null;
}

const apiKey = loadEnvKey();
const url = process.argv[2];
if (!apiKey) {
  console.error("No GEMINI_API_KEY found in env or .env.local");
  process.exit(1);
}
if (!url) {
  console.error("Usage: node scripts/test-youtube-notes.mjs <youtube-url>");
  process.exit(1);
}

const prompt = `You are helping catalog a vinyl record collection. Listen to this track and write notes in the collector's personal style.

The collector is a DJ. His notes are short, casual, lowercase-leaning, and focused on how a track feels and where it fits in a DJ set. Real examples of his notes:

Track: "Lost my foot"
- genre: dub deep house
- vocals: instrumental
- when_to_play: early set driver
- description: its got a washy dubby acidy ambient vibe to it. Slower pace but face melter

Track: "Sound"
- genre: tech house
- vocals: vocal
- when_to_play: late set
- description: Has a great acid baseline and long breakdown

Listen to the linked track and return JSON only, no markdown fence, with this shape:
{
  "title": "track title as best you can tell",
  "genre": "...",
  "vocals": "vocal" | "instrumental",
  "when_to_play": "...",
  "description": "2-3 sentences in his voice, mention key moments with rough timestamps (e.g. 'breakdown around 3:20')"
}`;

const body = {
  contents: [
    {
      parts: [
        { file_data: { file_uri: url } },
        { text: prompt },
      ],
    },
  ],
};

const model = "gemini-flash-latest";
const res = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }
);

if (!res.ok) {
  console.error(`Gemini API error ${res.status}:`);
  console.error(await res.text());
  process.exit(1);
}

const data = await res.json();
const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
console.log(text);
