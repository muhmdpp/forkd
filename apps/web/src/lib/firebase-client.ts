"use client";
import type { FirebaseWebConfig } from "@forkd/db";
import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  inMemoryPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";

export type ClientFirebaseConfig = FirebaseWebConfig & { authEmulatorUrl?: string };

function authFor(config: ClientFirebaseConfig) {
  const app: FirebaseApp = getApps()[0] ?? initializeApp(config);
  const auth = getAuth(app);
  if (config.authEmulatorUrl && !(auth as unknown as { _forkdEmu?: boolean })._forkdEmu) {
    connectAuthEmulator(auth, config.authEmulatorUrl, { disableWarnings: true });
    (auth as unknown as { _forkdEmu?: boolean })._forkdEmu = true;
  }
  return auth;
}

async function exchange(idToken: string, name?: string) {
  const res = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, name }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Sign-in failed. Try again.");
}

/** Signs in with Firebase in the browser, then hands the ID token to the server for a session cookie. */
export async function firebaseSignIn(
  config: ClientFirebaseConfig,
  mode: "signin" | "signup" | "google",
  creds?: { email: string; password: string; name?: string },
) {
  const auth = authFor(config);
  // The server cookie is the session; don't keep a second one in browser storage.
  await setPersistence(auth, inMemoryPersistence);
  let cred;
  if (mode === "google") cred = await signInWithPopup(auth, new GoogleAuthProvider());
  else if (mode === "signup") {
    cred = await createUserWithEmailAndPassword(auth, creds!.email, creds!.password);
    if (creds?.name) await updateProfile(cred.user, { displayName: creds.name });
  } else cred = await signInWithEmailAndPassword(auth, creds!.email, creds!.password);
  await exchange(await cred.user.getIdToken(true), creds?.name ?? cred.user.displayName ?? undefined);
  await signOut(auth);
}

export async function guestSignIn(name: string) {
  const res = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guest: true, name }),
  });
  if (!res.ok) throw new Error("Couldn't start a guest session.");
}

export async function signOutEverywhere() {
  await fetch("/api/session", { method: "DELETE" });
}

/** Turns Firebase error codes into sentences people understand. */
export function friendlyAuthError(err: unknown): string {
  const code = (err as { code?: string }).code ?? "";
  const map: Record<string, string> = {
    "auth/invalid-credential": "That email and password don't match. Try again or reset your password.",
    "auth/wrong-password": "That email and password don't match.",
    "auth/user-not-found": "No account with that email. Sign up instead?",
    "auth/email-already-in-use": "There's already an account with that email. Sign in instead.",
    "auth/weak-password": "Use a password with at least 8 characters.",
    "auth/invalid-email": "That email address doesn't look right.",
    "auth/too-many-requests": "Too many tries. Wait a minute and try again.",
    "auth/popup-closed-by-user": "Google sign-in was closed before it finished.",
    "auth/popup-blocked": "Your browser blocked the Google sign-in window. Allow pop-ups and try again.",
    "auth/network-request-failed": "No connection. Check your internet and try again.",
    "auth/unauthorized-domain": "This website isn't allowed to sign in yet. Add it under Authentication → Settings → Authorized domains in Firebase.",
    "auth/operation-not-allowed": "This sign-in method isn't turned on in Firebase yet.",
  };
  return map[code] ?? (err as Error).message ?? "Something went wrong. Try again.";
}
