import { NextResponse } from "next/server";
import { requireUserOr401 } from "@/lib/auth";
import { generateTrackNotes, normalizeYoutubeUrl } from "@/lib/gemini";
import { getNoteExamples } from "@/lib/queries";

// Gemini has to listen to the whole track, which can take a while —
// long tracks were hitting the 60s cap, so use the platform max
export const maxDuration = 300;

export async function POST(req: Request) {
  const auth = await requireUserOr401();
  if (auth.response) return auth.response;

  let body: { url?: string; title?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const url = body.url ? normalizeYoutubeUrl(body.url) : null;
  if (!url) {
    return NextResponse.json(
      { error: "Provide a valid YouTube link" },
      { status: 400 }
    );
  }

  const examples = await getNoteExamples(auth.user.id);

  try {
    const notes = await generateTrackNotes({
      youtubeUrl: url,
      trackTitle: body.title,
      examples,
    });
    return NextResponse.json(notes);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate notes";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
