import "server-only";
import { type Profile, ensureProfile, getAdminApp, getStore, isDemoMode } from "@forkd/db";
import { getAuth } from "firebase-admin/auth";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";

/**
 * Sessions are an httpOnly cookie.
 * - Firebase mode: a Firebase session cookie, minted from the ID token after the browser signs in.
 * - Demo mode: a signed guest token (the demo data lives in server memory anyway).
 */
export const SESSION_COOKIE = "__session";
const SESSION_DAYS = 14;

// Demo sessions only. A fixed fallback keeps guest cookies valid across server instances;
// demo data is public sample data, so there is nothing secret behind it.
const demoSecret = process.env.SESSION_SECRET ?? "forkd-demo-mode-guest-sessions";
const sign = (v: string) => createHmac("sha256", demoSecret).update(v).digest("base64url");

/** Guest identity lives in the cookie, so any server instance can rebuild the profile. */
interface GuestToken {
  uid: string;
  name: string;
  onb: boolean;
}
const encodeGuest = (t: GuestToken) => {
  const body = Buffer.from(JSON.stringify(t)).toString("base64url");
  return `demo.${body}.${sign(body)}`;
};
function decodeGuest(value: string): GuestToken | null {
  const [, body, sig] = value.split(".");
  if (!body || !sig) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(body));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const t = JSON.parse(Buffer.from(body, "base64url").toString()) as GuestToken;
    return typeof t.uid === "string" && t.uid.startsWith("guest_") ? t : null;
  } catch {
    return null;
  }
}

async function setCookie(value: string) {
  (await cookies()).set(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  });
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Firebase mode: exchange a fresh ID token for a session cookie and make sure a profile exists. */
export async function startFirebaseSession(idToken: string, name?: string) {
  const auth = getAuth(getAdminApp());
  const decoded = await auth.verifyIdToken(idToken);
  // Session cookies may only be minted from a recent sign-in.
  if (Date.now() / 1000 - decoded.auth_time > 5 * 60) throw new Error("Please sign in again.");
  const cookie = await auth.createSessionCookie(idToken, { expiresIn: SESSION_DAYS * 86_400_000 });
  await ensureProfile(decoded.uid, name || decoded.name || "", decoded.email ?? null);
  await setCookie(cookie);
}

/** Demo mode: a guest account that lives as long as the server process. */
export async function startGuestSession(name: string) {
  if (!isDemoMode) throw new Error("Guest sign-in is only available in demo mode.");
  const uid = `guest_${randomUUID().slice(0, 8)}`;
  const token = { uid, name: (name || "Guest").slice(0, 40), onb: false };
  await ensureProfile(uid, token.name, null);
  await setCookie(encodeGuest(token));
}

/** Demo mode: remember onboarding in the cookie too, since server memory may not persist. */
export async function markGuestOnboarded() {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  const t = value?.startsWith("demo.") ? decodeGuest(value) : null;
  if (t && !t.onb) await setCookie(encodeGuest({ ...t, onb: true }));
}

/** The signed-in person's profile, or null. Cached per request. */
export const getViewer = cache(async (): Promise<Profile | null> => {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!value) return null;
  const store = await getStore();
  if (value.startsWith("demo.")) {
    if (!isDemoMode) return null;
    const t = decodeGuest(value);
    if (!t) return null;
    const profile = (await store.getProfile(t.uid)) ?? (await ensureProfile(t.uid, t.name, null));
    if (t.onb && !profile.onboardedAt) {
      await store.updateProfile(t.uid, { onboardedAt: new Date() });
      profile.onboardedAt = new Date();
    }
    return profile;
  }
  if (isDemoMode) return null;
  try {
    const decoded = await getAuth(getAdminApp()).verifySessionCookie(value);
    return await store.getProfile(decoded.uid);
  } catch {
    return null;
  }
});
