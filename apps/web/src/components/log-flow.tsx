"use client";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { type ExperienceDraft, postExperience } from "@/app/actions";
import { resizeAndUpload } from "@/lib/photos";
import { I } from "./icons";
import { Photo } from "./ui";

type Vote = "over" | "ok" | "gem";
type Heard = "reel" | "friend" | "walked_by" | "forkd" | "other";

const VOTES: { v: Vote; label: string; icon: React.ReactNode }[] = [
  { v: "over", label: "Overhyped", icon: I.trendDown() },
  { v: "ok", label: "As expected", icon: I.check() },
  { v: "gem", label: "Better than expected", icon: I.trendUp() },
];
const HYPE = ["None", "A little", "Some", "A lot", "Viral"];
const HEARD: { v: Heard; label: string }[] = [
  { v: "reel", label: "A reel" },
  { v: "friend", label: "A friend" },
  { v: "walked_by", label: "Walked past" },
  { v: "forkd", label: "Forkd" },
  { v: "other", label: "Other" },
];

export function LogFlow({
  spot,
  suggestedDishes,
}: {
  spot: { id: string; slug: string; name: string; area: string; coverUrl: string | null };
  suggestedDishes: string[];
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [dishes, setDishes] = useState<string[]>([]);
  const [options, setOptions] = useState(suggestedDishes);
  const [adding, setAdding] = useState(false);
  const [newDish, setNewDish] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [vote, setVote] = useState<Vote | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(0);
  const [review, setReview] = useState("");
  const [wouldReturn, setWouldReturn] = useState<boolean | null>(null);
  const [expectation, setExpectation] = useState<number | null>(null);
  const [heard, setHeard] = useState<Heard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const toggleDish = (d: string) => setDishes((x) => (x.includes(d) ? x.filter((y) => y !== d) : [...x, d].slice(0, 8)));
  const shown = hover ?? rating;

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const list = [...files].slice(0, 4 - photos.length);
    setUploading((n) => n + list.length);
    for (const f of list) {
      try {
        const url = await resizeAndUpload(f);
        setPhotos((p) => [...p, url].slice(0, 4));
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  function submit() {
    setError(null);
    const draft: ExperienceDraft = {
      spotId: spot.id,
      rating,
      hypeVote: vote,
      expectation,
      heardFrom: heard,
      wouldReturn,
      dishes,
      photos,
      review: review.trim() || null,
    };
    start(async () => {
      const res = await postExperience(draft);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <main className="page cream">
      <header className="topbar">
        <div className="wrap flex w-full items-center gap-2">
          {step === 1 ? (
            <Link href={`/spots/${spot.slug}`} className="iconbtn" aria-label="Back">
              {I.back()}
            </Link>
          ) : (
            <button type="button" className="iconbtn" aria-label="Back" onClick={() => setStep(1)}>
              {I.back()}
            </button>
          )}
          <div className="title">Log an experience</div>
          <span className="small muted num">{step}/2</span>
        </div>
      </header>

      <div className="wrap flex flex-col gap-6 with-cta">
        <div className="card line flex items-center gap-3 p-3">
          <Photo src={spot.coverUrl} alt="" name={spot.name} style={{ width: 56, height: 56, flex: "none", borderRadius: 14 }} />
          <div className="min-w-0">
            <div className="truncate font-bold">{spot.name}</div>
            <div className="small muted">{spot.area}</div>
          </div>
        </div>

        {step === 1 ? (
          <>
            <fieldset className="flex flex-col gap-3">
              <legend className="h2 mb-3">What did you try?</legend>
              <div className="chips">
                {options.map((d) => (
                  <button key={d} type="button" className="chip" aria-pressed={dishes.includes(d)} onClick={() => toggleDish(d)}>
                    {d}
                    {dishes.includes(d) ? I.check() : null}
                  </button>
                ))}
                {adding ? (
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const d = newDish.trim().replace(/\s+/g, " ").slice(0, 40);
                      if (d) {
                        setOptions((o) => (o.includes(d) ? o : [...o, d]));
                        setDishes((x) => (x.includes(d) ? x : [...x, d]));
                      }
                      setNewDish("");
                      setAdding(false);
                    }}
                  >
                    <input
                      id="new-dish"
                      autoFocus
                      className="input !min-h-[36px] !rounded-full !py-1.5"
                      placeholder="Dish name"
                      value={newDish}
                      onChange={(e) => setNewDish(e.target.value)}
                      maxLength={40}
                    />
                    <button type="submit" className="btn sm primary">
                      Add
                    </button>
                  </form>
                ) : (
                  <button type="button" className="chip" style={{ background: "transparent", border: "1.5px dashed var(--line)" }} onClick={() => setAdding(true)}>
                    {I.plus()} Add more
                  </button>
                )}
              </div>
            </fieldset>

            <fieldset className="flex flex-col gap-2">
              <legend className="h2 mb-3">Your rating</legend>
              <div className="flex items-center gap-4">
                <div className="relative select-none" onMouseLeave={() => setHover(null)} style={{ fontSize: 42, lineHeight: 1, letterSpacing: 4 }}>
                  <div style={{ color: "var(--c-line)" }} aria-hidden="true">
                    ★★★★★
                  </div>
                  <div className="absolute inset-0 overflow-hidden whitespace-nowrap" style={{ width: `${(shown / 5) * 100}%`, color: "var(--mustard)" }} aria-hidden="true">
                    ★★★★★
                  </div>
                  <div className="absolute inset-0 grid grid-cols-10">
                    {Array.from({ length: 10 }, (_, i) => (i + 1) / 2).map((v) => (
                      <button
                        key={v}
                        type="button"
                        aria-label={`${v} stars`}
                        aria-pressed={rating === v}
                        className="opacity-0 focus-visible:opacity-30"
                        onMouseEnter={() => setHover(v)}
                        onClick={() => setRating(v)}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-[22px] font-bold num">{shown ? shown.toFixed(1) : "–"}</span>
              </div>
              <p className="tiny muted">Tap the left half of a star for a half star.</p>
            </fieldset>

            <fieldset className="flex flex-col gap-2">
              <legend className="h2 mb-3">How was the hype?</legend>
              <div className="optcards">
                {VOTES.map((o) => (
                  <button key={o.v} type="button" className="optcard" aria-pressed={vote === o.v} onClick={() => setVote(vote === o.v ? null : o.v)}>
                    {o.icon}
                    {o.label}
                  </button>
                ))}
              </div>
            </fieldset>
          </>
        ) : (
          <>
            <fieldset className="flex flex-col gap-3">
              <legend className="h2 mb-3">
                Add photos <span className="small muted font-normal">up to 4</span>
              </legend>
              <div className="grid grid-cols-4 gap-2">
                {photos.map((p) => (
                  <div key={p} className="relative">
                    <Photo src={p} alt="Your photo" name="photo" ratio="1" style={{ borderRadius: 14 }} />
                    <button
                      type="button"
                      className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black text-white"
                      aria-label="Remove photo"
                      onClick={() => setPhotos((x) => x.filter((y) => y !== p))}
                    >
                      {I.x({ width: 12, height: 12 })}
                    </button>
                  </div>
                ))}
                {Array.from({ length: uploading }, (_, i) => (
                  <div key={`u${i}`} className="grid aspect-square place-items-center rounded-[14px] small muted" style={{ background: "var(--c-200)" }}>
                    Uploading…
                  </div>
                ))}
                {photos.length + uploading < 4 ? (
                  <button
                    type="button"
                    className="grid aspect-square place-items-center rounded-[14px]"
                    style={{ border: "1.5px dashed var(--line)", color: "var(--muted)" }}
                    onClick={() => fileRef.current?.click()}
                    aria-label="Add photos"
                  >
                    {I.camera({ width: 26, height: 26 })}
                  </button>
                ) : null}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                multiple
                hidden
                onChange={(e) => {
                  void addPhotos(e.target.files);
                  e.target.value = "";
                }}
              />
            </fieldset>

            <label className="field">
              <span className="h2 !text-[24px]">Tell people about it</span>
              <textarea
                id="review"
                className="input"
                maxLength={1000}
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="What stood out? Would you recommend it to a friend?"
              />
            </label>

            <fieldset className="flex flex-col gap-2">
              <legend className="font-bold mb-2">Would you go back?</legend>
              <div className="chips">
                <button type="button" className="chip" aria-pressed={wouldReturn === true} onClick={() => setWouldReturn(wouldReturn === true ? null : true)}>
                  Yes, definitely
                </button>
                <button type="button" className="chip" aria-pressed={wouldReturn === false} onClick={() => setWouldReturn(wouldReturn === false ? null : false)}>
                  Probably not
                </button>
              </div>
            </fieldset>

            <fieldset className="flex flex-col gap-2">
              <legend className="font-bold mb-2">Before going, how much hype had you heard?</legend>
              <div className="grid grid-cols-5 gap-1.5">
                {HYPE.map((t, i) => (
                  <button
                    key={t}
                    type="button"
                    className="optcard !min-h-[56px] !text-[11.5px]"
                    aria-pressed={expectation === i + 1}
                    onClick={() => setExpectation(expectation === i + 1 ? null : i + 1)}
                  >
                    <b className="num text-[16px]">{i + 1}</b>
                    {t}
                  </button>
                ))}
              </div>
              <p className="tiny muted">This powers the hype check: what people expected vs how they rated it.</p>
            </fieldset>

            <fieldset className="flex flex-col gap-2">
              <legend className="font-bold mb-2">Where did you hear about it?</legend>
              <div className="chips">
                {HEARD.map((h) => (
                  <button key={h.v} type="button" className="chip" aria-pressed={heard === h.v} onClick={() => setHeard(heard === h.v ? null : h.v)}>
                    {h.label}
                  </button>
                ))}
              </div>
            </fieldset>
          </>
        )}
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="cta-bar">
        <div>
          {step === 1 ? (
            <button type="button" className="btn primary wide" disabled={!rating} onClick={() => setStep(2)}>
              {rating ? "Next" : "Rate it to continue"}
            </button>
          ) : (
            <button type="button" className="btn primary wide" disabled={pending || uploading > 0} onClick={submit}>
              {pending ? "Posting…" : uploading ? "Waiting for photos…" : "Post experience"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
