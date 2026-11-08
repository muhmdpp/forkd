"use client";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { postComment } from "@/app/actions";

export function CommentForm({ visitId, signedIn }: { visitId: string; signedIn: boolean }) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLInputElement>(null);
  if (!signedIn) {
    return (
      <Link href={`/signin?next=/e/${visitId}`} className="btn wide">
        Sign in to comment
      </Link>
    );
  }
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const res = await postComment(visitId, text);
          if (res?.error) setError(res.error);
          else {
            setText("");
            ref.current?.blur();
          }
        });
      }}
    >
      <div className="flex gap-2">
        <input
          ref={ref}
          id="comment"
          className="input !rounded-full !py-2.5"
          placeholder="Add a comment…"
          value={text}
          maxLength={500}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="btn primary" disabled={pending || !text.trim()}>
          Post
        </button>
      </div>
      {error ? <p className="error">{error}</p> : null}
    </form>
  );
}
