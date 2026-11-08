import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...p,
});

export const I = {
  home: (p: P = {}) => (
    <svg {...base(p)}>
      <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" />
    </svg>
  ),
  homeFill: (p: P = {}) => (
    <svg {...base(p)} fill="currentColor">
      <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" />
    </svg>
  ),
  compass: (p: P = {}) => (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.5 8.5-2 5-5 2 2-5z" />
    </svg>
  ),
  search: (p: P = {}) => (
    <svg {...base(p)}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  ),
  plus: (p: P = {}) => (
    <svg {...base(p)} strokeWidth={2.4}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  bell: (p: P = {}) => (
    <svg {...base(p)}>
      <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" />
      <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
    </svg>
  ),
  user: (p: P = {}) => (
    <svg {...base(p)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5c1.4-3.7 4.2-5.5 7.5-5.5s6.1 1.8 7.5 5.5" />
    </svg>
  ),
  back: (p: P = {}) => (
    <svg {...base(p)} strokeWidth={2.2}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  ),
  arrowRight: (p: P = {}) => (
    <svg {...base(p)} strokeWidth={2.4}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  chevronRight: (p: P = {}) => (
    <svg {...base(p)} strokeWidth={2.4}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  ),
  chevronDown: (p: P = {}) => (
    <svg {...base(p)} strokeWidth={2.4}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  bookmark: (p: P = {}) => (
    <svg {...base(p)}>
      <path d="M6.5 4h11v16.5L12 16.8l-5.5 3.7z" />
    </svg>
  ),
  bookmarkFill: (p: P = {}) => (
    <svg {...base(p)} fill="currentColor">
      <path d="M6.5 4h11v16.5L12 16.8l-5.5 3.7z" />
    </svg>
  ),
  share: (p: P = {}) => (
    <svg {...base(p)}>
      <path d="M12 15V4M8 8l4-4 4 4" />
      <path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" />
    </svg>
  ),
  heart: (p: P = {}) => (
    <svg {...base(p)}>
      <path d="M12 20s-7.5-4.5-9.3-9.2C1.5 7.5 3.6 4.5 6.9 4.5c2 0 3.6 1.1 5.1 3 1.5-1.9 3.1-3 5.1-3 3.3 0 5.4 3 4.2 6.3C19.5 15.5 12 20 12 20z" />
    </svg>
  ),
  heartFill: (p: P = {}) => (
    <svg {...base(p)} fill="currentColor">
      <path d="M12 20s-7.5-4.5-9.3-9.2C1.5 7.5 3.6 4.5 6.9 4.5c2 0 3.6 1.1 5.1 3 1.5-1.9 3.1-3 5.1-3 3.3 0 5.4 3 4.2 6.3C19.5 15.5 12 20 12 20z" />
    </svg>
  ),
  comment: (p: P = {}) => (
    <svg {...base(p)}>
      <path d="M4 12a8 8 0 1 1 3.5 6.6L4 19.5l1-3.4A7.9 7.9 0 0 1 4 12z" />
    </svg>
  ),
  check: (p: P = {}) => (
    <svg {...base(p)} strokeWidth={2.6}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  ),
  checkCircle: (p: P = {}) => (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="9" fill="currentColor" stroke="none" />
      <path d="m8 12.3 2.7 2.7L16 9.7" stroke="#fff" strokeWidth={2.4} />
    </svg>
  ),
  x: (p: P = {}) => (
    <svg {...base(p)} strokeWidth={2.6}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
  more: (p: P = {}) => (
    <svg {...base(p)} fill="currentColor" stroke="none">
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  ),
  star: (p: P = {}) => (
    <svg {...base(p)} fill="currentColor" stroke="none">
      <path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6L12 16.7l-5.4 2.9 1.1-6-4.5-4.2 6.1-.8z" />
    </svg>
  ),
  starLine: (p: P = {}) => (
    <svg {...base(p)} strokeWidth={1.6}>
      <path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6L12 16.7l-5.4 2.9 1.1-6-4.5-4.2 6.1-.8z" />
    </svg>
  ),
  camera: (p: P = {}) => (
    <svg {...base(p)}>
      <path d="M4 8h3l2-2.5h6L17 8h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  ),
  settings: (p: P = {}) => (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
    </svg>
  ),
  trendDown: (p: P = {}) => (
    <svg {...base(p)}>
      <path d="m3 7 6 6 4-4 8 8M15 17h6v-6" />
    </svg>
  ),
  trendUp: (p: P = {}) => (
    <svg {...base(p)}>
      <path d="m3 17 6-6 4 4 8-8M15 7h6v6" />
    </svg>
  ),
  flame: (p: P = {}) => (
    <svg {...base(p)}>
      <path d="M12 21c-3.9 0-6.5-2.6-6.5-6.1 0-4.4 4.5-6.2 4.5-10.9 2.9 1.6 4.7 4.4 4.7 7.2.9-.7 1.4-1.8 1.5-2.9 1.7 1.5 2.3 3.9 2.3 6.1 0 3.9-2.6 6.6-6.5 6.6z" />
    </svg>
  ),
  gem: (p: P = {}) => (
    <svg {...base(p)}>
      <path d="M6.5 4h11L21 9l-9 11L3 9z" />
      <path d="M3 9h18M9.5 4 8 9l4 11 4-11-1.5-5" />
    </svg>
  ),
  thumb: (p: P = {}) => (
    <svg {...base(p)}>
      <path d="M7 10v10H4V10zM7 10l4-6.5c1.3 0 2.2 1 2 2.3L12.5 9.5H19a2 2 0 0 1 2 2.3l-1.2 6.4A2 2 0 0 1 17.8 20H7" />
    </svg>
  ),
  grid: (p: P = {}) => (
    <svg {...base(p)}>
      <rect x="4" y="4" width="7" height="7" rx="2" />
      <rect x="13" y="4" width="7" height="7" rx="2" />
      <rect x="4" y="13" width="7" height="7" rx="2" />
      <rect x="13" y="13" width="7" height="7" rx="2" />
    </svg>
  ),
  pin: (p: P = {}) => (
    <svg {...base(p)}>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z" />
      <circle cx="12" cy="10" r="2.3" />
    </svg>
  ),
  list: (p: P = {}) => (
    <svg {...base(p)}>
      <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
    </svg>
  ),
  logout: (p: P = {}) => (
    <svg {...base(p)}>
      <path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" />
    </svg>
  ),
  swipe: (p: P = {}) => (
    <svg {...base(p)}>
      <rect x="6" y="3" width="12" height="15" rx="2.5" transform="rotate(-8 12 10.5)" />
      <path d="M8 21h8" />
    </svg>
  ),
};

/** Simple line icons for food categories (Explore circles). */
export const CategoryIcon = ({ id, ...p }: P & { id: string }) => {
  switch (id) {
    case "biryani":
      return (
        <svg {...base(p)}>
          <path d="M3.5 11h17a8.5 7 0 0 1-17 0z" />
          <path d="M6 11c.5-2.2 3-3.5 6-3.5s5.5 1.3 6 3.5M10 7.5 9 5.5M14 7.5l1-2" />
        </svg>
      );
    case "arabic":
      return (
        <svg {...base(p)}>
          <ellipse cx="12" cy="14" rx="9" ry="4.5" />
          <path d="M6.5 12.5c1-2.5 3.2-4 5.5-4s4.5 1.5 5.5 4" />
          <path d="M12 8.5V6" />
        </svg>
      );
    case "seafood":
      return (
        <svg {...base(p)}>
          <path d="M3 12c3-4.5 9-5.5 13.5-2.5L21 6.5v11l-4.5-3C12 17.5 6 16.5 3 12z" />
          <circle cx="7.5" cy="11.3" r=".9" fill="currentColor" />
        </svg>
      );
    case "meals":
      return (
        <svg {...base(p)}>
          <path d="M4 19c0-8 5-14 16-15-1 11-7 16-15 16" />
          <path d="M4 20 14 10" />
        </svg>
      );
    case "snacks":
      return (
        <svg {...base(p)}>
          <path d="M4 18 12 5l8 13z" />
          <path d="M8 13h8" />
        </svg>
      );
    case "cafe":
      return (
        <svg {...base(p)}>
          <path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" />
          <path d="M16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M8 6c0-1 1-1 1-2M12 6c0-1 1-1 1-2" />
        </svg>
      );
    case "dessert":
      return (
        <svg {...base(p)}>
          <path d="M5 20h14l-1.5-8h-11z" />
          <path d="M6 12c0-3.5 2.7-6 6-6s6 2.5 6 6M12 6V3.5" />
        </svg>
      );
    case "chinese":
      return (
        <svg {...base(p)}>
          <path d="M3.5 11h17a8.5 8 0 0 1-17 0z" />
          <path d="m14 9 6-6M10.5 9 18 2.5" />
        </svg>
      );
    case "bakery":
      return (
        <svg {...base(p)}>
          <path d="M4 11a4 4 0 0 1 3-6.5c1.3 0 2.5.6 3.2 1.5a5 5 0 0 1 3.6 0A4 4 0 0 1 20 11v8H4z" />
          <path d="M9 13v3M15 13v3" />
        </svg>
      );
    default:
      return I.grid(p);
  }
};
