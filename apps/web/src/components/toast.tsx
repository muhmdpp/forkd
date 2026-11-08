"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const MESSAGES: Record<string, string> = {
  logged: "Posted. Your picks just got smarter.",
  rated: "Saved. Your picks have been updated.",
  added: "Spot added. Now log your experience.",
  hidden: "Got it. We'll show less like that.",
  welcome: "You're in. Here's what we picked for you.",
  saved: "Profile saved.",
  deleted: "Experience deleted.",
  created: "Collection created.",
};

/** Shows a one-off message passed as ?toast=key, then cleans the URL. */
export function Toast() {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const key = params.get("toast");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!key) return;
    setMsg(MESSAGES[key] ?? null);
    const next = new URLSearchParams(params);
    next.delete("toast");
    router.replace(next.size ? `${path}?${next}` : path, { scroll: false });
    const t = setTimeout(() => setMsg(null), 3000);
    return () => clearTimeout(t);
  }, [key, params, path, router]);

  if (!msg) return null;
  return (
    <div className="toast" role="status">
      {msg}
    </div>
  );
}
