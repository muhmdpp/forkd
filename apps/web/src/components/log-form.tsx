"use client";
import { useActionState, useState } from "react";
import { type FormState, logVisit } from "@/app/actions";

const HYPE = [
  { v: 1, t: "None" },
  { v: 2, t: "A little" },
  { v: 3, t: "Some" },
  { v: 4, t: "A lot" },
  { v: 5, t: "Viral" },
];
const HEARD = [
  { v: "reel", t: "A reel" },
  { v: "friend", t: "A friend" },
  { v: "walked_by", t: "Walked past" },
  { v: "forkd", t: "Forkd" },
  { v: "other", t: "Other" },
];
const VOTES = [
  { v: "gem", t: "Better", s: "than expected" },
  { v: "ok", t: "As", s: "expected" },
  { v: "over", t: "Over", s: "hyped" },
];

export function LogForm({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(logVisit, undefined);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [expectation, setExpectation] = useState<number | null>(null);
  const [heard, setHeard] = useState<string | null>(null);
  const [vote, setVote] = useState<string | null>(null);
  const shown = hover ?? rating;

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="rating" value={rating || ""} />
      <input type="hidden" name="expectation" value={expectation ?? ""} />
      <input type="hidden" name="heardFrom" value={heard ?? ""} />
      <input type="hidden" name="hypeVote" value={vote ?? ""} />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-semibold">Your rating</legend>
        <div className="flex items-center gap-4">
          <div className="relative text-[40px] leading-none tracking-[4px] select-none" onMouseLeave={() => setHover(null)}>
            <div style={{ color: "var(--line)" }} aria-hidden="true">★★★★★</div>
            <div className="absolute inset-0 overflow-hidden whitespace-nowrap stars" style={{ width: `${(shown / 5) * 100}%` }} aria-hidden="true">
              ★★★★★
            </div>
            <div className="absolute inset-0 grid grid-cols-10">
              {Array.from({ length: 10 }, (_, i) => (i + 1) / 2).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-label={`${v} stars`}
                  aria-pressed={rating === v}
                  className="opacity-0 focus-visible:opacity-30 focus-visible:bg-[var(--hot)]"
                  onMouseEnter={() => setHover(v)}
                  onClick={() => setRating(v)}
                />
              ))}
            </div>
          </div>
          <span className="num text-[22px] muted">{shown ? shown.toFixed(1) : "–"}</span>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-semibold">Before going, how much hype had you heard?</legend>
        <div className="grid grid-cols-5 gap-1.5">
          {HYPE.map((h) => (
            <button key={h.v} type="button" className="option !px-1 !text-[12px]" aria-pressed={expectation === h.v} onClick={() => setExpectation(expectation === h.v ? null : h.v)}>
              <span className="num text-[16px]">{h.v}</span>
              <small>{h.t}</small>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-semibold">Where did you hear about it?</legend>
        <div className="flex flex-wrap gap-2">
          {HEARD.map((h) => (
            <button key={h.v} type="button" className="chip" aria-pressed={heard === h.v} onClick={() => setHeard(heard === h.v ? null : h.v)}>
              {h.t}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-semibold">Was it worth the hype?</legend>
        <div className="grid grid-cols-3 gap-2">
          {VOTES.map((h) => (
            <button key={h.v} type="button" className="option" aria-pressed={vote === h.v} onClick={() => setVote(vote === h.v ? null : h.v)}>
              {h.t}
              <small>{h.s}</small>
            </button>
          ))}
        </div>
      </fieldset>

      <label className="field">
        <span>
          Review <span className="meta font-normal">optional</span>
        </span>
        <textarea id="review" name="review" className="input" maxLength={1000} placeholder="What did you order? Would you go back?" />
      </label>

      {state?.error ? <p className="error" role="alert">{state.error}</p> : null}
      <button type="submit" className="btn btn-hot btn-block" disabled={!rating || pending}>
        {pending ? "Saving…" : rating ? "Save to diary" : "Pick a rating first"}
      </button>
    </form>
  );
}
