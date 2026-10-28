import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shell flex min-h-dvh flex-col items-start justify-center gap-4">
      <span className="sticker sticker-cap">404</span>
      <h1 className="display">This spot doesn&rsquo;t exist. <em>Yet.</em></h1>
      <Link href="/" className="btn btn-hot">Back to my picks</Link>
    </main>
  );
}
