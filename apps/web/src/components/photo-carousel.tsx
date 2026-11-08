"use client";
import { useRef, useState } from "react";

export function PhotoCarousel({ photos, alt }: { photos: string[]; alt: string }) {
  const [i, setI] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div className="relative">
      <div
        ref={ref}
        className="flex snap-x snap-mandatory overflow-x-auto"
        style={{ scrollbarWidth: "none", borderRadius: 20 }}
        onScroll={(e) => {
          const el = e.currentTarget;
          setI(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
        }}
      >
        {photos.map((p, k) => (
          <img
            key={p}
            src={p}
            alt={photos.length > 1 ? `${alt}, photo ${k + 1} of ${photos.length}` : alt}
            className="w-full flex-none snap-start object-cover"
            style={{ aspectRatio: "1 / 1" }}
            loading={k === 0 ? "eager" : "lazy"}
          />
        ))}
      </div>
      {photos.length > 1 ? (
        <>
          <span className="pill absolute right-3 top-3 num" style={{ background: "rgb(10 20 14 / .7)", color: "#fff" }}>
            {i + 1}/{photos.length}
          </span>
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5" aria-hidden="true">
            {photos.map((p, k) => (
              <span key={p} className="h-1.5 rounded-full transition-all" style={{ width: k === i ? 16 : 6, background: k === i ? "#fff" : "rgb(255 255 255 / .55)" }} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
