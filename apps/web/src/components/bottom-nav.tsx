"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { I } from "./icons";

export function BottomNav({ handle, unread = false }: { handle: string; unread?: boolean }) {
  const path = usePathname();
  const me = `/u/${handle}`;
  const item = (href: string, label: string, icon: React.ReactNode, active: boolean, badge = false) => (
    <Link href={href} className="nav-item" aria-current={active ? "page" : undefined}>
      {badge ? <span className="badge" aria-label="New activity" /> : null}
      {icon}
      {label}
    </Link>
  );
  return (
    <nav className="nav" aria-label="Main">
      <div className="nav-inner">
        {item("/", "Home", path === "/" ? I.homeFill() : I.home(), path === "/")}
        {item("/explore", "Explore", I.compass(), path.startsWith("/explore") || path.startsWith("/collections"))}
        <Link href="/log" className="nav-plus" aria-label="Log an experience">
          {I.plus()}
        </Link>
        {item("/activity", "Activity", I.bell(), path.startsWith("/activity"), unread)}
        {item(me, "You", I.user(), path.startsWith(me) || path.startsWith("/settings") || path.startsWith("/taste"))}
      </div>
    </nav>
  );
}
