"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { saveCravings } from "@/app/actions";
import { I } from "./icons";
import { Photo } from "./ui";

export function CravingsPicker({
  categories,
  initial,
}: {
  categories: { id: string; label: string; imageUrl: string | null }[];
  initial: string[];
}) {
  const [picked, setPicked] = useState<string[]>(initial);
  const [pending, start] = useTransition();
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <main className="page cream">
      <header className="topbar">
        <div className="wrap flex w-full items-center">
          <Link href="/" className="iconbtn" aria-label="Back">
            {I.back()}
          </Link>
          <div className="flex-1" />
          <span className="small font-semibold num">3/4</span>
        </div>
      </header>
      <div className="wrap flex flex-col gap-5 with-cta">
        <div className="flex flex-col gap-2 pt-2">
          <h1 className="display">What do you normally crave?</h1>
          <p className="muted">Pick a few. We&rsquo;ll use this to find better spots for you.</p>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {categories.map((c) => {
            const on = picked.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(c.id)}
                className="relative overflow-hidden text-left"
                style={{ borderRadius: 18, outline: on ? "3px solid var(--g-900)" : "none", outlineOffset: 2 }}
              >
                <Photo src={c.imageUrl} alt="" name={c.label} ratio="1 / 1.08" style={{ borderRadius: 18 }}>
                  <div className="shade" />
                  <span className="absolute bottom-2 left-0 right-0 text-center font-bold text-[14px] text-white" style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>
                    {c.label}
                  </span>
                  {on ? (
                    <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-white" style={{ color: "var(--g-900)" }}>
                      {I.check({ width: 15, height: 15 })}
                    </span>
                  ) : null}
                </Photo>
              </button>
            );
          })}
        </div>
      </div>
      <div className="cta-bar">
        <div>
          <button type="button" className="btn primary wide" disabled={pending} onClick={() => start(() => saveCravings(picked))}>
            {pending ? "Saving…" : picked.length ? "Continue" : "Skip for now"}
          </button>
        </div>
      </div>
    </main>
  );
}
