import Link from "next/link";
import { Wordmark } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="page">
      <div className="wrap flex min-h-dvh flex-col items-start justify-center gap-5">
        <Wordmark size={40} />
        <h1 className="display">We couldn&rsquo;t find that page.</h1>
        <p className="muted">It may have been deleted, or the link is wrong.</p>
        <Link href="/" className="btn yellow">
          Go home
        </Link>
      </div>
    </main>
  );
}
