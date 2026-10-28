import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shell flex min-h-dvh flex-col items-start justify-center gap-4">
      <p className="kicker">404</p>
      <h1 className="display">We couldn&rsquo;t find that page.</h1>
      <Link href="/" className="btn btn-hot">Go home</Link>
    </main>
  );
}
