import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { googleEnabled } from "@/lib/auth";
import { getViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function SignIn({ searchParams }: { searchParams: Promise<{ next?: string; mode?: string }> }) {
  const sp = await searchParams;
  const next = sp.next?.startsWith("/") && !sp.next.startsWith("//") ? sp.next : "/";
  if (await getViewer()) redirect(next);
  return (
    <main className="shell flex flex-col gap-6 !pb-10 pt-[calc(20px+env(safe-area-inset-top))]">
      <Link href="/" className="wordmark">
        fork<span>d</span>
      </Link>
      <div className="flex flex-col gap-2">
        <h1 className="display">Welcome to Forkd</h1>
        <p className="muted">Sign up in a few seconds, rate a few places, and get suggestions that suit you.</p>
      </div>
      <AuthForm mode={sp.mode === "signup" ? "signup" : "signin"} next={next} google={googleEnabled} />
    </main>
  );
}
