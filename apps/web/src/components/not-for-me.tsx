"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { hideSpot } from "@/app/actions";

const REASONS = [
  { id: "cuisine", title: "Not my kind of food", sub: "Show me less of this category" },
  { id: "price", title: "Too pricey", sub: "Lean towards cheaper places" },
  { id: "hype", title: "Looks like pure hype", sub: "Trust reels less when picking for me" },
  { id: "other", title: "Just not now", sub: "Hide it, don't change my taste" },
] as const;

export function NotForMe({ spotId, spotName, compact = false }: { spotId: string; spotName: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const path = usePathname();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button type="button" className={`btn btn-ghost ${compact ? "" : ""}`} onClick={() => setOpen(true)}>
        Not for me
      </button>
      {open ? (
        <div className="scrim" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="nfm-title">
            <div className="grab" />
            <div>
              <h2 id="nfm-title" className="h2">
                Not feeling it?
              </h2>
              <p className="meta mt-1">Tell us why and we'll hide {spotName} and learn from it.</p>
            </div>
            <div className="flex flex-col gap-2">
              {REASONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  disabled={pending}
                  className="card text-left px-4 py-3 disabled:opacity-50"
                  onClick={() => start(() => hideSpot(spotId, r.id, path))}
                >
                  <div className="font-semibold">{r.title}</div>
                  <div className="meta">{r.sub}</div>
                </button>
              ))}
            </div>
            <button type="button" className="btn btn-ghost btn-block" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
