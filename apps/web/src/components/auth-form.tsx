"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type ClientFirebaseConfig, firebaseSignIn, friendlyAuthError, guestSignIn } from "@/lib/firebase-client";

export function AuthForm({
  mode: initial,
  next,
  config,
  demo,
}: {
  mode: "signin" | "signup";
  next: string;
  config: ClientFirebaseConfig | null;
  demo: boolean;
}) {
  const [mode, setMode] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const done = () => {
    router.replace(next);
    router.refresh();
  };

  async function run(fn: () => Promise<void>) {
    setError(null);
    setBusy(true);
    try {
      await fn();
      done();
    } catch (e) {
      setError(friendlyAuthError(e));
      setBusy(false);
    }
  }

  if (demo || !config) {
    return (
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          const name = String(new FormData(e.currentTarget).get("name") ?? "").trim();
          void run(() => guestSignIn(name));
        }}
      >
        <p className="card line p-4 small">
          This is the demo version, so there are no real accounts yet. Pick a name and look around. Anything you add
          disappears when the demo server restarts.
        </p>
        <label className="field">
          <span>Your name</span>
          <input id="name" name="name" className="input" autoComplete="given-name" placeholder="Anu" maxLength={40} />
        </label>
        {error ? <p className="error" role="alert">{error}</p> : null}
        <button type="submit" className="btn primary wide" disabled={busy}>
          {busy ? "One sec…" : "Continue as guest"}
        </button>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <button type="button" className="btn wide" disabled={busy} onClick={() => run(() => firebaseSignIn(config, "google"))}>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.6 3.8-5.4 3.8-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z" />
        </svg>
        Continue with Google
      </button>
      <div className="flex items-center gap-3 muted small">
        <span className="h-px flex-1" style={{ background: "var(--line)" }} />
        or with email
        <span className="h-px flex-1" style={{ background: "var(--line)" }} />
      </div>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const creds = {
            email: String(f.get("email") ?? "").trim(),
            password: String(f.get("password") ?? ""),
            name: String(f.get("name") ?? "").trim() || undefined,
          };
          void run(() => firebaseSignIn(config, mode, creds));
        }}
      >
        {mode === "signup" ? (
          <label className="field">
            <span>Your name</span>
            <input id="name" name="name" className="input" autoComplete="name" placeholder="Anu Thomas" maxLength={40} />
          </label>
        ) : null}
        <label className="field">
          <span>Email</span>
          <input id="email" name="email" type="email" required className="input" autoComplete="email" placeholder="you@example.com" />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="input"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder="At least 8 characters"
          />
        </label>
        {error ? <p className="error" role="alert">{error}</p> : null}
        <button type="submit" className="btn primary wide" disabled={busy}>
          {busy ? "One sec…" : mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>
      <button type="button" className="btn ghost" onClick={() => setMode(mode === "signup" ? "signin" : "signup")}>
        {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
      </button>
    </div>
  );
}
