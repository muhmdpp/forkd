import type { HypeLabel } from "@forkd/core";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { I } from "./icons";

export function Wordmark({ size = 30, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`wordmark ${className}`} style={{ fontSize: size }} aria-label="forkd">
      forkd<i>.</i>
    </span>
  );
}

export function initials(name: string) {
  const w = name.replace(/[^\p{L}\p{N} ]/gu, "").split(/\s+/).filter(Boolean);
  return (w.slice(0, 2).map((x) => x[0]!.toUpperCase()).join("") || "F").slice(0, 2);
}

const hueOf = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

/** A food photo with a graceful fallback when there is none. */
export function Photo({
  src,
  alt,
  name,
  className = "",
  style,
  ratio,
  priority = false,
  children,
}: {
  src: string | null | undefined;
  alt: string;
  name: string;
  className?: string;
  style?: CSSProperties;
  ratio?: string;
  priority?: boolean;
  children?: ReactNode;
}) {
  const h = hueOf(name);
  return (
    <div
      className={`photo ${className}`}
      style={{ aspectRatio: ratio, background: src ? undefined : `linear-gradient(135deg, hsl(${h} 45% 32%), hsl(${(h + 40) % 360} 50% 22%))`, ...style }}
    >
      {src ? (
        // Plain img: photos come from our own route or Unsplash's CDN, which already resize.
        <img src={src} alt={alt} loading={priority ? "eager" : "lazy"} decoding="async" />
      ) : (
        <span className="fallback" aria-hidden="true">
          {initials(name)}
        </span>
      )}
      {children}
    </div>
  );
}

export function Avatar({ name, src, size = 40 }: { name: string; src?: string | null; size?: number }) {
  const h = hueOf(name);
  return (
    <span
      className="avatar"
      style={{ "--size": `${size}px`, background: src ? undefined : `hsl(${h} 70% 78%)` } as CSSProperties}
      aria-hidden="true"
    >
      {src ? <img src={src} alt="" /> : initials(name)}
    </span>
  );
}

export function Rating({ value, size = 15, className = "" }: { value: number; size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 font-bold num ${className}`} style={{ fontSize: size }}>
      {value.toFixed(1)}
      <I.star style={{ width: size, height: size, color: "var(--mustard)" }} />
    </span>
  );
}

export function StarRow({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex" aria-label={`${value} out of 5 stars`} style={{ color: "var(--mustard)" }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <span key={i} style={{ position: "relative", width: size, height: size }}>
            <I.starLine style={{ position: "absolute", inset: 0, width: size, height: size, opacity: 0.5 }} />
            <span style={{ position: "absolute", inset: 0, width: `${fill * 100}%`, overflow: "hidden" }}>
              <I.star style={{ width: size, height: size }} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

export const HYPE_PILL: Record<HypeLabel, { cls: string; text: string; icon: (p: object) => ReactNode }> = {
  overhyped: { cls: "over", text: "Overhyped", icon: I.flame },
  lives_up: { cls: "worth", text: "Worth the hype", icon: I.checkCircle },
  hidden_gem: { cls: "gem", text: "Hidden gem", icon: I.gem },
  not_enough_data: { cls: "new", text: "New", icon: I.starLine },
};

export function HypePill({ label, icon = true }: { label: HypeLabel; icon?: boolean }) {
  const p = HYPE_PILL[label];
  return (
    <span className={`pill ${p.cls}`}>
      {icon ? p.icon({}) : null}
      {p.text}
    </span>
  );
}

export const VOTE_TEXT = { over: "Overhyped", ok: "As expected", gem: "Better than expected" } as const;

export function priceRange(band: number) {
  return band <= 1 ? "Under ₹200" : band === 2 ? "₹200 – ₹500" : "₹500+";
}
export const rupees = (band: number) => "₹".repeat(Math.max(1, Math.min(3, band)));

export function timeAgo(d: Date | string) {
  const s = Math.max(1, (Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function BackBar({
  href,
  title,
  right,
  glass = false,
}: {
  href: string;
  title?: string;
  right?: ReactNode;
  glass?: boolean;
}) {
  return (
    <header className="topbar" style={glass ? { background: "transparent", position: "absolute", left: 0, right: 0 } : undefined}>
      <div className="wrap flex w-full items-center gap-2">
        <Link href={href} className={`iconbtn ${glass ? "glass" : ""}`} aria-label="Back">
          {I.back({})}
        </Link>
        <div className="title truncate">{title}</div>
        {right}
      </div>
    </header>
  );
}

export function SectionTitle({ title, href, note }: { title: string; href?: string; note?: string }) {
  const inner = (
    <>
      <h2 className="h2">{title}</h2>
      {href ? I.chevronRight({ width: 20, height: 20 }) : null}
    </>
  );
  return (
    <div className="flex items-end justify-between gap-3">
      {href ? (
        <Link href={href} className="flex items-center gap-1">
          {inner}
        </Link>
      ) : (
        <div className="flex items-center gap-1">{inner}</div>
      )}
      {note ? <span className="muted small">{note}</span> : null}
    </div>
  );
}

export const CITY_LABEL: Record<string, string> = { kozhikode: "Kozhikode" };
