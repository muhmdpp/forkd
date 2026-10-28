"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function AuthForm({ mode: initial, next, google }: { mode: "signin" | "signup"; next: string; google: boolean }) {
  const [mode, setMode] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") ?? "").trim();
    const password = String(f.get("password") ?? "");
    const res =
      mode === "signup"
        ? await authClient.signUp.email({ email, password, name: String(f.get("name") ?? "").trim() || email.split("@")[0]! })
        : await authClient.signIn.email({ email, password });
    setBusy(false);
    if (res.error) {
      setError(res.error.message ?? "That didn't work. Check your details and try again.");
      return;
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="seg" role="group" aria-label="Sign in or sign up">
        <button type="button" aria-pressed={mode === "signup"} onClick={() => setMode("signup")}>
          Sign up
        </button>
        <button type="button" aria-pressed={mode === "signin"} onClick={() => setMode("signin")}>
          Sign in
        </button>
      </div>
      {google ? (
        <>
          <button
            type="button"
            className="btn btn-block"
            onClick={() => authClient.signIn.social({ provider: "google", callbackURL: next })}
          >
            Continue with Google
          </button>
          <div className="meta text-center">or with email</div>
        </>
      ) : null}
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        {mode === "signup" ? (
          <label className="field">
            <span>Your name</span>
            <input id="name" name="name" className="input" autoComplete="name" placeholder="Anu" />
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
        <button type="submit" className="btn btn-hot btn-block" disabled={busy}>
          {busy ? "One sec…" : mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
