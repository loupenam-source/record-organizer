import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  ensureSchema,
  getSql,
  getUserConfig,
  type UserRow,
} from "./db";

const COOKIE_NAME = "ro_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function getSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      "AUTH_SECRET is not set (or too short). Set a 32+ char random string in your env."
    );
  }
  return s;
}

function sign(username: string): string {
  return createHmac("sha256", getSecret()).update(username).digest("hex");
}

function verifyToken(token: string | undefined): string | null {
  if (!token) return null;
  const [username, sig] = token.split(".");
  if (!username || !sig) return null;
  const expected = sign(username);
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return null;
  return timingSafeEqual(a, b) ? username : null;
}

function makeToken(username: string): string {
  return `${username}.${sign(username)}`;
}

export async function getCurrentUser(): Promise<UserRow | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  const username = verifyToken(token);
  if (!username) return null;
  await ensureSchema();
  const rows = await getSql()`SELECT * FROM users WHERE username = ${username}`;
  return (rows[0] as UserRow | undefined) ?? null;
}

export async function requireUser(): Promise<UserRow> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireUserOr401(): Promise<
  { user: UserRow; response: null } | { user: null; response: Response }
> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      user: null,
      response: new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }
  return { user, response: null };
}

export function verifyPasscode(username: string, passcode: string): boolean {
  const users = getUserConfig();
  const match = users.find((u) => u.username === username);
  if (!match) return false;
  const a = Buffer.from(match.passcode);
  const b = Buffer.from(passcode);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function signIn(username: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, makeToken(username), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function signOut(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function listUsers(): Promise<UserRow[]> {
  await ensureSchema();
  const rows = await getSql()`SELECT * FROM users ORDER BY username`;
  return rows as UserRow[];
}

export async function getUserByUsername(username: string): Promise<UserRow | null> {
  await ensureSchema();
  const rows = await getSql()`SELECT * FROM users WHERE username = ${username}`;
  return (rows[0] as UserRow | undefined) ?? null;
}
