"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOutEverywhere } from "@/lib/firebase-client";
import { I } from "./icons";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="btn wide"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await signOutEverywhere();
        router.replace("/");
        router.refresh();
      }}
    >
      {I.logout({ width: 18, height: 18 })}
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
