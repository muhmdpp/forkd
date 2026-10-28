"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const MESSAGES: Record<string, string> = {
  logged: "Saved. Your picks have been updated.",
  added: "Spot added. Thanks!",
  hidden: "Got it. We'll show less like that.",
  welcome: "All set. Here are your picks.",
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
    const t = setTimeout(() => setMsg(null), 3200);
    return () => clearTimeout(t);
  }, [key, params, path, router]);

  if (!msg) return null;
  return (
    <div className="toast" role="status">
      {msg}
    </div>
  );
}
