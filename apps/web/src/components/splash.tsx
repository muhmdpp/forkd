import Link from "next/link";
import { Wordmark } from "./ui";

const HERO = "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=900&q=75";

export function Splash() {
  return (
    <main className="page relative overflow-hidden" style={{ minHeight: "100dvh" }}>
      {/* mustard swoosh */}
      <svg
        aria-hidden="true"
        viewBox="0 0 400 400"
        className="absolute"
        style={{ left: "-18%", bottom: "-6%", width: "78%", maxWidth: 360, color: "var(--mustard)" }}
      >
        <path d="M40 360c40-120 120-210 250-250-60 70-95 140-100 210 50-40 100-70 160-80-80 60-120 110-140 160H40z" fill="currentColor" />
      </svg>
      <div
        className="absolute overflow-hidden rounded-full"
        style={{ right: "-22%", bottom: "-4%", width: "86%", maxWidth: 420, aspectRatio: "1", boxShadow: "0 30px 60px rgb(0 0 0 / .45)" }}
      >
        <img src={HERO} alt="A clay pot of biryani" className="h-full w-full object-cover" />
      </div>
      <div className="wrap relative flex flex-col gap-5" style={{ paddingTop: "calc(18vh + env(safe-area-inset-top))" }}>
        <Wordmark size={84} />
        <p className="text-[22px] leading-[1.25] font-medium" style={{ maxWidth: 220 }}>
          Food spots for people who actually eat out.
        </p>
        <div className="mt-4 flex flex-col gap-3" style={{ maxWidth: 260 }}>
          <Link href="/start" className="btn yellow wide">
            Get started
          </Link>
          <Link href="/signin" className="btn ghost" style={{ color: "var(--on-g)" }}>
            I already have an account
          </Link>
        </div>
      </div>
    </main>
  );
}
