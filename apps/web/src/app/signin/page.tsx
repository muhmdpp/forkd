import { getFirebaseWebConfig, isDemoMode } from "@forkd/db";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { BackBar, Wordmark } from "@/components/ui";
import { getViewer } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function SignIn({ searchParams }: { searchParams: Promise<{ next?: string; mode?: string }> }) {
  const sp = await searchParams;
  const next = sp.next?.startsWith("/") && !sp.next.startsWith("//") ? sp.next : "/";
  if (await getViewer()) redirect(next);
  const signup = sp.mode === "signup";
  return (
    <main className="page cream">
      <BackBar href={signup ? "/start" : "/"} />
      <div className="wrap flex flex-col gap-6 pb-10">
        <div className="flex flex-col gap-3 pt-2">
          <Wordmark size={40} />
          <h1 className="display">{signup ? "Make your account" : "Welcome back"}</h1>
          <p className="muted">
            {signup ? "Takes a few seconds. Then tell us what you crave." : "Sign in to see your picks."}
          </p>
        </div>
        <AuthForm mode={signup ? "signup" : "signin"} next={next} config={getFirebaseWebConfig()} demo={isDemoMode} />
      </div>
    </main>
  );
}
