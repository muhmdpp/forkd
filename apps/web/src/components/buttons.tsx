"use client";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { followAction, toggleLike, toggleSave } from "@/app/actions";
import { I } from "./icons";

export function LikeButton({
  visitId,
  liked,
  count,
  signedIn,
}: {
  visitId: string;
  liked: boolean;
  count: number;
  signedIn: boolean;
}) {
  const [state, setState] = useOptimistic({ liked, count }, (_s, next: { liked: boolean; count: number }) => next);
  const [, start] = useTransition();
  if (!signedIn) {
    return (
      <Link href="/signin" className="inline-flex items-center gap-1.5 font-semibold" aria-label="Sign in to like">
        {I.heart({ width: 24, height: 24 })}
        <span className="num">{count}</span>
      </Link>
    );
  }
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 font-semibold"
      aria-pressed={state.liked}
      aria-label={state.liked ? "Unlike" : "Like"}
      onClick={() =>
        start(async () => {
          const next = { liked: !state.liked, count: state.count + (state.liked ? -1 : 1) };
          setState(next);
          await toggleLike(visitId, next.liked);
        })
      }
    >
      <span style={{ color: state.liked ? "var(--red)" : undefined }}>
        {state.liked ? I.heartFill({ width: 24, height: 24 }) : I.heart({ width: 24, height: 24 })}
      </span>
      <span className="num">{state.count}</span>
    </button>
  );
}

export function SaveButton({
  spotId,
  saved,
  signedIn,
  className = "iconbtn",
}: {
  spotId: string;
  saved: boolean;
  signedIn: boolean;
  className?: string;
}) {
  const [on, setOn] = useOptimistic(saved, (_s, v: boolean) => v);
  const [, start] = useTransition();
  if (!signedIn) {
    return (
      <Link href="/signin" className={className} aria-label="Sign in to save">
        {I.bookmark()}
      </Link>
    );
  }
  return (
    <button
      type="button"
      className={className}
      aria-pressed={on}
      aria-label={on ? "Remove from saved" : "Save spot"}
      onClick={() =>
        start(async () => {
          setOn(!on);
          await toggleSave(spotId, !on);
        })
      }
    >
      {on ? I.bookmarkFill() : I.bookmark()}
    </button>
  );
}

export function FollowButton({ uid, following, small = false }: { uid: string; following: boolean; small?: boolean }) {
  const [on, setOn] = useOptimistic(following, (_s, v: boolean) => v);
  const [, start] = useTransition();
  return (
    <button
      type="button"
      className={`btn ${on ? "" : "primary"} ${small ? "sm" : ""}`}
      aria-pressed={on}
      onClick={() =>
        start(async () => {
          setOn(!on);
          await followAction(uid, !on);
        })
      }
    >
      {on ? "Following" : "Follow"}
    </button>
  );
}

export function ShareButton({ title, path, className = "iconbtn" }: { title: string; path: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={className}
      aria-label={copied ? "Link copied" : "Share"}
      onClick={async () => {
        const url = `${location.origin}${path}`;
        try {
          if (navigator.share) {
            await navigator.share({ title, url });
            return;
          }
        } catch {
          return; // dismissed
        }
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          /* clipboard blocked: nothing else to do */
        }
      }}
    >
      {copied ? I.check() : I.share()}
    </button>
  );
}
