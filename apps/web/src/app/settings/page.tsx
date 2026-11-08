import { isDemoMode } from "@forkd/db";
import type { Metadata } from "next";
import Link from "next/link";
import { I } from "@/components/icons";
import { SignOutButton } from "@/components/sign-out";
import { BackBar } from "@/components/ui";
import { requireViewer } from "@/lib/data";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function Settings() {
  const viewer = await requireViewer("/settings");
  const items = [
    { href: "/settings/profile", label: "Edit profile", icon: I.user },
    { href: "/taste", label: "Your taste profile", icon: I.star },
    { href: "/rate", label: "Rate more spots", icon: I.swipe },
    { href: `/u/${viewer.handle}?tab=saved`, label: "Saved spots", icon: I.bookmark },
    { href: "/spots/new", label: "Add a spot", icon: I.plus },
  ];
  return (
    <main className="page cream">
      <BackBar href={`/u/${viewer.handle}`} title="Settings" />
      <div className="wrap flex flex-col gap-6 pb-12">
        <div className="card line stack px-4">
          {items.map((it) => (
            <Link key={it.href} href={it.href} className="flex items-center gap-3 py-4 font-semibold">
              {it.icon({ width: 20, height: 20 })}
              <span className="flex-1">{it.label}</span>
              {I.chevronRight({ width: 18, height: 18 })}
            </Link>
          ))}
        </div>
        <SignOutButton />
        <p className="tiny muted text-center">
          {isDemoMode ? "Demo version: data resets when the server restarts." : "Signed in with Firebase."} Forkd beta.
        </p>
      </div>
    </main>
  );
}
