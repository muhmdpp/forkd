"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./ui";

const items = [
  { href: "/", label: "For you", icon: Icon.home, match: (p: string) => p === "/" },
  { href: "/explore", label: "Explore", icon: Icon.explore, match: (p: string) => p.startsWith("/explore") },
  { href: "/log", label: "Log", icon: Icon.plus, match: () => false, log: true },
  { href: "/diary", label: "Diary", icon: Icon.diary, match: (p: string) => p.startsWith("/diary") },
  { href: "/me", label: "Taste", icon: Icon.me, match: (p: string) => p.startsWith("/me") },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="nav" aria-label="Main">
      <div className="nav-inner">
        {items.map((it) =>
          it.log ? (
            <Link key={it.href} href={it.href} className="nav-log" aria-label="Log a visit">
              {it.icon}
            </Link>
          ) : (
            <Link key={it.href} href={it.href} className="nav-item" aria-current={it.match(path) ? "page" : undefined}>
              {it.icon}
              {it.label}
            </Link>
          ),
        )}
      </div>
    </nav>
  );
}
