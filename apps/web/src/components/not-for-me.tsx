"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { hideSpot } from "@/app/actions";

const REASONS = [
  { id: "cuisine", title: "Not my kind of food", sub: "Show me less of this type" },
  { id: "price", title: "Too expensive", sub: "Show me cheaper places" },
  { id: "hype", title: "Looks overhyped", sub: "Rely less on hype when picking for me" },
  { id: "other", title: "Just not now", sub: "Hide it, don't change my taste" },
] as const;

export function NotForMe({ spotId, spotName }: { spotId: string; spotName: string }) {
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
      <button type="button" className="btn ghost sm" onClick={() => setOpen(true)}>
        Not for me
      </button>
      {open ? (
        <div className="scrim" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="nfm-title">
            <div className="grab" />
            <div>
              <h2 id="nfm-title" className="h1">
                Not for you?
              </h2>
              <p className="muted mt-1 small">Tell us why. We&rsquo;ll hide {spotName} and learn from it.</p>
            </div>
            <div className="flex flex-col gap-2">
              {REASONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  disabled={pending}
                  className="card line px-4 py-3 text-left disabled:opacity-50"
                  onClick={() => start(() => hideSpot(spotId, r.id, path))}
                >
                  <div className="font-bold">{r.title}</div>
                  <div className="small muted">{r.sub}</div>
                </button>
              ))}
            </div>
            <button type="button" className="btn ghost wide" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
