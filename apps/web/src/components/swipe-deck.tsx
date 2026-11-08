"use client";
import { type CSSProperties, useCallback, useEffect, useRef, useState, useTransition } from "react";
import { saveSwipes } from "@/app/actions";
import { I } from "./icons";
import { Photo, rupees } from "./ui";

export interface DeckSpot {
  id: string;
  name: string;
  area: string;
  coverUrl: string | null;
  categoryText: string;
  mustOrder: string | null;
  priceBand: number;
}

type Verdict = "loved" | "okay" | "nope" | "skip";
const RATING: Record<Exclude<Verdict, "skip">, number> = { loved: 4.5, okay: 3, nope: 1.5 };
const THRESHOLD = 100;

/**
 * Bumble-style deck: right = liked it, left = didn't, up or down = haven't been.
 * Every gesture also has a button, and arrow keys work on desktop.
 */
export function SwipeDeck({
  spots,
  next,
  minAnswers = 3,
  doneLabel = "Save",
}: {
  spots: DeckSpot[];
  next: string;
  minAnswers?: number;
  doneLabel?: string;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<{ spotId: string; rating: number }[]>([]);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [leaving, setLeaving] = useState<Verdict | null>(null);
  const [pending, start] = useTransition();
  const startPt = useRef<{ x: number; y: number } | null>(null);
  const skipDir = useRef<1 | -1>(-1);

  const current = spots[index];
  const upcoming = spots[index + 1];

  const finish = useCallback((all: { spotId: string; rating: number }[]) => start(() => saveSwipes(all, next)), [next]);

  const decide = useCallback(
    (v: Verdict) => {
      if (!current || leaving) return;
      setLeaving(v);
      const nextAnswers = v === "skip" ? answers : [...answers, { spotId: current.id, rating: RATING[v] }];
      setTimeout(() => {
        setAnswers(nextAnswers);
        setLeaving(null);
        setDrag({ x: 0, y: 0, active: false });
        setIndex((i) => i + 1);
        if (index + 1 >= spots.length) finish(nextAnswers);
      }, 240);
    },
    [answers, current, finish, index, leaving, spots.length],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") decide("loved");
      if (e.key === "ArrowLeft") decide("nope");
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        skipDir.current = e.key === "ArrowUp" ? -1 : 1;
        decide("skip");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [decide]);

  if (!current || pending) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
        <h2 className="display">{pending ? "Finding your spots…" : "All done"}</h2>
        <p className="muted">You rated {answers.length} spot{answers.length === 1 ? "" : "s"}.</p>
        {!pending && spots.length === 0 ? (
          <button type="button" className="btn primary" onClick={() => finish([])}>
            Continue
          </button>
        ) : null}
      </div>
    );
  }

  const onDown = (e: React.PointerEvent) => {
    if (leaving) return;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    startPt.current = { x: e.clientX, y: e.clientY };
    setDrag({ x: 0, y: 0, active: true });
  };
  const onMove = (e: React.PointerEvent) => {
    if (!startPt.current) return;
    setDrag({ x: e.clientX - startPt.current.x, y: e.clientY - startPt.current.y, active: true });
  };
  const onUp = () => {
    if (!startPt.current) return;
    startPt.current = null;
    const vertical = Math.abs(drag.y) > Math.abs(drag.x);
    if (vertical && Math.abs(drag.y) > THRESHOLD) {
      skipDir.current = drag.y < 0 ? -1 : 1;
      decide("skip");
    } else if (!vertical && drag.x > THRESHOLD) decide("loved");
    else if (!vertical && drag.x < -THRESHOLD) decide("nope");
    else setDrag({ x: 0, y: 0, active: false });
  };

  const x = leaving ? (leaving === "loved" ? 640 : leaving === "nope" ? -640 : 0) : drag.x;
  const y = leaving ? (leaving === "skip" ? 760 * skipDir.current : leaving === "okay" ? -760 : 0) : drag.y;
  const vertical = Math.abs(y) > Math.abs(x);
  const love = vertical ? 0 : Math.min(1, Math.max(0, x / THRESHOLD));
  const nope = vertical ? 0 : Math.min(1, Math.max(0, -x / THRESHOLD));
  const skip = vertical ? Math.min(1, Math.abs(y) / THRESHOLD) : 0;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex justify-between small muted num">
        <span>
          {index + 1} of {spots.length}
        </span>
        <span>{answers.length} rated</span>
      </div>
      <div className="relative mx-auto w-full select-none" style={{ aspectRatio: "3 / 4", maxWidth: 360 }}>
        {upcoming ? (
          <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: 26, transform: "translateY(12px) scale(0.95)", opacity: 0.6 }} aria-hidden="true">
            <Photo src={upcoming.coverUrl} alt="" name={upcoming.name} style={{ height: "100%", borderRadius: 26 }} />
          </div>
        ) : null}
        <div
          key={current.id}
          className="absolute inset-0 touch-none cursor-grab overflow-hidden active:cursor-grabbing"
          style={
            {
              borderRadius: 26,
              transform: `translate(${x}px, ${y}px) rotate(${x / 24}deg)`,
              transition: drag.active && !leaving ? "none" : "transform 0.24s cubic-bezier(0.2, 0.8, 0.2, 1)",
              boxShadow: "0 18px 40px rgb(30 20 0 / .25)",
            } as CSSProperties
          }
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          role="group"
          aria-roledescription="swipe card"
          aria-label={`${current.name}. Swipe right if you liked it, left if you didn't, up or down if you haven't been.`}
        >
          <Photo src={current.coverUrl} alt={current.name} name={current.name} style={{ height: "100%", borderRadius: 26 }} priority>
            <div className="shade" style={{ background: "linear-gradient(180deg, transparent 35%, rgb(5 14 9 / .92))" }} />
            <span className="pill gem absolute left-4 top-4 !text-[16px]" style={{ opacity: love }}>
              Liked it
            </span>
            <span className="pill over absolute right-4 top-4 !text-[16px]" style={{ opacity: nope }}>
              Didn&rsquo;t like it
            </span>
            <span className="pill worth absolute left-1/2 top-4 -translate-x-1/2 !text-[16px]" style={{ opacity: skip }}>
              Haven&rsquo;t been
            </span>
            <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-1 p-5 text-white">
              <h2 className="display" style={{ fontSize: 34 }}>
                {current.name}
              </h2>
              <p className="text-[14px] opacity-85">
                {current.area} · {current.categoryText} · {rupees(current.priceBand)}
              </p>
              {current.mustOrder ? <p className="text-[14px] opacity-85">Known for the {current.mustOrder.toLowerCase()}</p> : null}
            </div>
          </Photo>
        </div>
      </div>
      <p className="text-center small muted">Right if you liked it, left if not, up or down if you haven&rsquo;t been.</p>
      <div className="flex items-center justify-center gap-4">
        <button type="button" className="grid h-16 w-16 place-items-center rounded-full bg-white" style={{ color: "var(--red)", boxShadow: "0 6px 16px rgb(0 0 0 / .1)" }} onClick={() => decide("nope")} aria-label="Didn't like it">
          {I.x({ width: 26, height: 26 })}
        </button>
        <button type="button" className="btn sm" onClick={() => decide("skip")}>
          Haven&rsquo;t been
        </button>
        <button type="button" className="grid h-16 w-16 place-items-center rounded-full bg-white" style={{ color: "var(--mint)", boxShadow: "0 6px 16px rgb(0 0 0 / .1)" }} onClick={() => decide("loved")} aria-label="Liked it">
          {I.heartFill({ width: 26, height: 26 })}
        </button>
      </div>
      <div className="flex items-center justify-center gap-2">
        <button type="button" className="btn ghost sm" onClick={() => decide("okay")}>
          It was just okay
        </button>
        {answers.length >= minAnswers ? (
          <button type="button" className="btn primary sm" onClick={() => finish(answers)}>
            {doneLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
