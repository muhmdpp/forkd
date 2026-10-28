import { HYPE_LABEL_TEXT, type HypeLabel, rupees, starText } from "@forkd/core";
import type { CSSProperties, ReactNode } from "react";

export function initials(name: string) {
  const words = name
    .replace(/[^\p{L}\p{N} ]/gu, "")
    .split(/\s+/)
    .filter((w) => w && !/^(the|and|co)$/i.test(w));
  return (words.slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "F").slice(0, 2);
}

export function Plate({ name, hue, size = "" }: { name: string; hue: number; size?: "" | "sm" | "lg" | "xl" }) {
  return (
    <div className={`plate ${size}`} style={{ "--h": hue } as CSSProperties} aria-hidden="true">
      <span>{initials(name)}</span>
    </div>
  );
}

const STICKER_CLASS: Record<HypeLabel, string> = {
  overhyped: "sticker-cap",
  hidden_gem: "sticker-gem",
  lives_up: "sticker-legit",
  not_enough_data: "",
};

export function HypeSticker({ label, flat = false }: { label: HypeLabel; flat?: boolean }) {
  return <span className={`sticker ${STICKER_CLASS[label]} ${flat ? "flat" : ""}`}>{HYPE_LABEL_TEXT[label]}</span>;
}

export function Ring({ match }: { match: number }) {
  const color = match >= 70 ? "var(--gem)" : match >= 50 ? "var(--sun)" : "var(--cap)";
  return (
    <div className="ring" style={{ "--p": match, "--c": color } as CSSProperties} aria-label={`${match}% match`}>
      <div>
        <b>{match}%</b>
        <small>match</small>
      </div>
    </div>
  );
}

export function Stars({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span className={`stars ${className}`} aria-label={`${value} out of 5 stars`}>
      {starText(value)}
    </span>
  );
}

export function SpotMeta({ area, categoryText, priceBand }: { area: string; categoryText: string; priceBand: number }) {
  return (
    <div className="meta">
      {area} · {categoryText} · {rupees(priceBand)}
    </div>
  );
}

export function SectionHead({ title, note, action }: { title: string; note?: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="h2">{title}</h2>
        {note ? <p className="meta mt-1">{note}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function TopBar({ children }: { children?: ReactNode }) {
  return (
    <header className="topbar">
      <a href="/" className="wordmark" aria-label="Forkd home">
        fork<span>d</span>
      </a>
      <div className="flex-1" />
      {children}
    </header>
  );
}

export function SampleNote() {
  return (
    <p className="sample-note">
      <span className="sticker flat">Sample</span>
      <span>Spots tagged sample and their reviewers are demo data to show how Forkd learns.</span>
    </p>
  );
}

export const Icon = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l2.7 5.6 6.1.8-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1L3.2 9.4l6.1-.8z" />
    </svg>
  ),
  explore: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  diary: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <rect x="4" y="3" width="16" height="18" rx="3" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  ),
  me: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </svg>
  ),
  back: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  ),
};
