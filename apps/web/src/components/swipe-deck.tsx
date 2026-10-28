"use client";
import { type CSSProperties, useCallback, useEffect, useRef, useState, useTransition } from "react";
import { saveSwipes } from "@/app/actions";
import { Plate } from "./ui";

export interface DeckSpot {
  id: string;
  name: string;
  area: string;
  hue: number;
  categoryText: string;
  mustOrder: string | null;
  priceBand: number;
}

type Verdict = "loved" | "okay" | "nope" | "skip";
const RATING: Record<Exclude<Verdict, "skip">, number> = { loved: 4.5, okay: 3, nope: 1.5 };
const THRESHOLD = 110;

export function SwipeDeck({
  spots,
  next,
  minAnswers = 3,
  doneLabel = "Show my picks",
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
  const finished = index >= spots.length;

  const finish = useCallback(
    (all: { spotId: string; rating: number }[]) => start(() => saveSwipes(all, next)),
    [next],
  );

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
      }, 260);
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

  const onDown = (e: React.PointerEvent) => {
    if (leaving) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
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

  const flyX = leaving === "loved" ? 600 : leaving === "nope" ? -600 : 0;
  const flyY = leaving === "skip" ? 700 * skipDir.current : leaving === "okay" ? -700 : 0;
  const x = leaving ? flyX : drag.x;
  const y = leaving ? flyY : drag.y;
  const vertical = Math.abs(y) > Math.abs(x);
  const love = vertical ? 0 : Math.min(1, Math.max(0, x / THRESHOLD));
  const nope = vertical ? 0 : Math.min(1, Math.max(0, -x / THRESHOLD));
  const skip = vertical ? Math.min(1, Math.abs(y) / THRESHOLD) : 0;

  if (finished || pending) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <div className="display">{pending ? "Cooking your picks…" : "That's the lot."}</div>
        <p className="muted">{answers.length} rated. Your taste is locked in.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="flex items-center justify-between">
        <span className="kicker">
          {index + 1} / {spots.length}
        </span>
        <span className="meta">{answers.length} rated</span>
      </div>

      <div className="relative mx-auto aspect-[3/4] w-full max-w-[360px] select-none">
        {upcoming ? (
          <div className="card absolute inset-0 scale-[0.94] opacity-70 p-3" aria-hidden="true" style={{ transform: "translateY(14px) scale(0.94)" }}>
            <Plate name={upcoming.name} hue={upcoming.hue} size="xl" />
          </div>
        ) : null}
        {current ? (
          <div
            key={current.id}
            className="card-pop absolute inset-0 flex touch-none cursor-grab flex-col gap-3 p-3 active:cursor-grabbing"
            style={
              {
                transform: `translate(${x}px, ${y}px) rotate(${x / 18}deg)`,
                transition: drag.active && !leaving ? "none" : "transform 0.26s cubic-bezier(0.2, 0.8, 0.2, 1)",
                boxShadow: love > 0 ? `5px 5px 0 var(--gem)` : nope > 0 ? `5px 5px 0 var(--cap)` : undefined,
              } as CSSProperties
            }
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            role="group"
            aria-roledescription="swipe card"
            aria-label={`${current.name}. Swipe right if you liked it, left if you didn't.`}
          >
            <div className="relative">
              <Plate name={current.name} hue={current.hue} size="xl" />
              <span
                className="sticker sticker-gem absolute left-4 top-5 !text-[20px] !px-3 !py-1.5"
                style={{ opacity: love, transform: "rotate(-14deg)", background: "var(--bg)" }}
              >
                Loved it
              </span>
              <span
                className="sticker sticker-cap absolute right-4 top-5 !text-[20px] !px-3 !py-1.5"
                style={{ opacity: nope, transform: "rotate(12deg)", background: "var(--bg)" }}
              >
                Nope
              </span>
              <span
                className="sticker absolute left-1/2 top-1/2 !text-[18px] !px-3 !py-1.5"
                style={{ opacity: skip, transform: "translate(-50%, -50%) rotate(-4deg)", background: "var(--bg)" }}
              >
                Haven&rsquo;t been
              </span>
            </div>
            <div className="flex flex-col gap-1 px-1">
              <h2 className="h2 !text-[22px]">{current.name}</h2>
              <p className="meta">
                {current.area} · {current.categoryText} · {"₹".repeat(current.priceBand)}
              </p>
              {current.mustOrder ? <p className="text-[14px]">Known for the {current.mustOrder.toLowerCase()}</p> : null}
            </div>
            <p className="meta mt-auto px-1 text-center">
              Right = loved it · Left = nope · Up or down = haven&rsquo;t been
            </p>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-center gap-4">
        <button type="button" className="swipe-btn swipe-nope" onClick={() => decide("nope")} aria-label="Didn't like it">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <button type="button" className="btn" onClick={() => decide("skip")}>
          Haven&rsquo;t been
        </button>
        <button type="button" className="swipe-btn swipe-love" onClick={() => decide("loved")} aria-label="Loved it">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-9.6-9.3C1 8.4 3 5 6.4 5c2 0 3.6 1.1 4.6 2.6l1 1.4 1-1.4C14 6.1 15.6 5 17.6 5 21 5 23 8.4 21.6 11.7 19.5 16.4 12 21 12 21z" /></svg>
        </button>
      </div>
      <div className="flex items-center justify-center gap-3">
        <button type="button" className="text-[14px] font-semibold underline decoration-2 underline-offset-4 muted" onClick={() => decide("okay")}>
          It was just okay
        </button>
        {answers.length >= minAnswers ? (
          <button type="button" className="btn btn-hot" onClick={() => finish(answers)}>
            {doneLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
