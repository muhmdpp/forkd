"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { I } from "./icons";

const SLIDES = [
  {
    title: (
      <>
        Find food spots you&rsquo;ll <span className="highlight">actually</span> like.
      </>
    ),
    body: "Honest ratings, personalised picks, and a reality check on the hype.",
    photo: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=75",
    alt: "Grilled meat and vegetables",
  },
  {
    title: (
      <>
        See through the <span className="highlight">hype</span>.
      </>
    ),
    body: "Before you queue for a viral spot, see how people rated it after they went.",
    photo: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=900&q=75",
    alt: "A chocolate cookie frappe",
  },
];

export function IntroSlides() {
  const [i, setI] = useState(0);
  const router = useRouter();
  const slide = SLIDES[i]!;
  const next = () => (i < SLIDES.length - 1 ? setI(i + 1) : router.push("/signin?mode=signup"));

  return (
    <main className="page cream relative overflow-hidden" style={{ minHeight: "100dvh" }}>
      <div className="wrap relative z-10 flex flex-col gap-6" style={{ paddingTop: "calc(16px + env(safe-area-inset-top))" }}>
        <div className="flex items-center gap-3">
          <div className="flex flex-1 gap-1.5" aria-label={`Step ${i + 1} of 4`}>
            {[0, 1, 2, 3].map((k) => (
              <span key={k} className="h-1 flex-1 rounded-full" style={{ background: k <= i ? "var(--g-900)" : "var(--c-line)" }} />
            ))}
          </div>
          <Link href="/signin?mode=signup" className="small font-semibold">
            Skip
          </Link>
        </div>
        <div key={i} className="rise flex flex-col gap-4 pt-6">
          <h1 className="display xl">{slide.title}</h1>
          <p className="text-[16px]" style={{ maxWidth: 300 }}>
            {slide.body}
          </p>
        </div>
      </div>
      <svg aria-hidden="true" viewBox="0 0 300 300" className="absolute" style={{ right: "-8%", bottom: "-8%", width: "72%", maxWidth: 340, color: "var(--mustard)" }}>
        <path d="M300 30C210 90 120 190 60 300h240z" fill="currentColor" />
      </svg>
      <div
        key={`p${i}`}
        className="rise absolute overflow-hidden rounded-full"
        style={{ left: "-10%", bottom: "6%", width: "78%", maxWidth: 380, aspectRatio: "1", boxShadow: "0 24px 50px rgb(40 30 0 / .25)" }}
      >
        <img src={slide.photo} alt={slide.alt} className="h-full w-full object-cover" />
      </div>
      <button
        type="button"
        onClick={next}
        className="roundbtn absolute"
        style={{ right: "max(22px, env(safe-area-inset-right))", bottom: "calc(30px + env(safe-area-inset-bottom))" }}
        aria-label={i < SLIDES.length - 1 ? "Next" : "Create your account"}
      >
        {I.arrowRight()}
      </button>
    </main>
  );
}
