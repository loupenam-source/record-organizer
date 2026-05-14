import { NextResponse } from "next/server";
import { requireUserOr401 } from "@/lib/auth";

type DiscogsArtist = { name: string };
type DiscogsTrack = {
  position: string;
  title: string;
  type_?: string;
};
type DiscogsRelease = {
  id: number;
  title: string;
  year?: number;
  artists?: DiscogsArtist[];
  tracklist?: DiscogsTrack[];
};

type ImportedTrack = {
  side: "A" | "B";
  position: number;
  title: string;
};

const USER_AGENT = "RecordOrganizer/0.1 +https://github.com/loupena";

function extractReleaseId(input: string): string | null {
  const trimmed = input.trim();
  if (/^\d+$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/\/release(?:s)?\/(\d+)/i);
  return match ? match[1] : null;
}

function cleanArtistName(name: string): string {
  return name.replace(/\s*\(\d+\)\s*$/, "").trim();
}

function joinArtists(artists: DiscogsArtist[] | undefined): string {
  if (!artists || artists.length === 0) return "";
  return artists.map((a) => cleanArtistName(a.name)).join(", ");
}

function parsePosition(raw: string): { side: "A" | "B"; position: number | null } | null {
  const trimmed = raw.trim().toUpperCase();
  if (!trimmed) return null;
  const match = trimmed.match(/^([AB])?\s*(\d+)?/);
  if (!match || (!match[1] && !match[2])) return null;
  const side = (match[1] as "A" | "B" | undefined) ?? "A";
  const position = match[2] ? Number(match[2]) : null;
  if (position !== null && (!Number.isFinite(position) || position < 1)) return null;
  return { side, position };
}

function normalizeTracks(tracklist: DiscogsTrack[] | undefined): ImportedTrack[] {
  if (!tracklist) return [];
  const out: ImportedTrack[] = [];
  const sideCounters: Record<"A" | "B", number> = { A: 0, B: 0 };
  for (const t of tracklist) {
    if (t.type_ && t.type_ !== "track") continue;
    const parsed = parsePosition(t.position);
    if (!parsed) continue;
    sideCounters[parsed.side] += 1;
    const position = parsed.position ?? sideCounters[parsed.side];
    out.push({ side: parsed.side, position, title: t.title });
  }
  return out;
}

export async function GET(req: Request) {
  const auth = await requireUserOr401();
  if (auth.response) return auth.response;
  const { searchParams } = new URL(req.url);
  const input = searchParams.get("url") ?? searchParams.get("id");
  if (!input) {
    return NextResponse.json(
      { error: "Provide ?url=<discogs release url> or ?id=<release id>" },
      { status: 400 }
    );
  }
  const releaseId = extractReleaseId(input);
  if (!releaseId) {
    return NextResponse.json(
      { error: "Could not find a Discogs release ID in that input" },
      { status: 400 }
    );
  }

  const res = await fetch(`https://api.discogs.com/releases/${releaseId}`, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
  });

  if (res.status === 404) {
    return NextResponse.json({ error: "Release not found on Discogs" }, { status: 404 });
  }
  if (res.status === 429) {
    return NextResponse.json(
      { error: "Discogs rate limit hit, try again in a minute" },
      { status: 429 }
    );
  }
  if (!res.ok) {
    return NextResponse.json(
      { error: `Discogs returned ${res.status}` },
      { status: 502 }
    );
  }

  const data = (await res.json()) as DiscogsRelease;
  return NextResponse.json({
    artist: joinArtists(data.artists),
    album: data.title ?? "",
    year: data.year && data.year > 0 ? data.year : null,
    tracks: normalizeTracks(data.tracklist),
  });
}
