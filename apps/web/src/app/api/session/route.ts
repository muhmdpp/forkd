import { isDemoMode } from "@forkd/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { clearSession, startFirebaseSession, startGuestSession } from "@/lib/auth";

const body = z.union([
  z.object({ idToken: z.string().min(10), name: z.string().trim().max(60).optional() }),
  z.object({ guest: z.literal(true), name: z.string().trim().max(60).optional() }),
]);

export async function POST(req: Request) {
  // Same-origin only: the session cookie must never be set by another site.
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) {
    return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  }
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  try {
    if ("guest" in parsed.data) await startGuestSession(parsed.data.name ?? "");
    else if (isDemoMode) return NextResponse.json({ error: "Firebase is not configured" }, { status: 400 });
    else await startFirebaseSession(parsed.data.idToken, parsed.data.name);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[forkd] session error", err);
    return NextResponse.json({ error: (err as Error).message || "Sign-in failed" }, { status: 401 });
  }
}

export async function DELETE() {
  await clearSession();
  return NextResponse.json({ ok: true });
}
