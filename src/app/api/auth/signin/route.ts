import { NextResponse } from "next/server";
import { signIn, verifyPasscode } from "@/lib/auth";

export async function POST(req: Request) {
  const { username, passcode } = (await req.json()) as {
    username?: string;
    passcode?: string;
  };
  if (!username || !passcode) {
    return NextResponse.json(
      { error: "username and passcode required" },
      { status: 400 }
    );
  }
  if (!verifyPasscode(username, passcode)) {
    return NextResponse.json({ error: "Invalid passcode" }, { status: 401 });
  }
  await signIn(username);
  return NextResponse.json({ ok: true });
}
