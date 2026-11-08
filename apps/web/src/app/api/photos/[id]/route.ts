import { getStore } from "@forkd/db";

/** Serves uploaded photos. Ids are random and photos never change, so they cache forever. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[A-Za-z0-9-]{8,64}$/.test(id)) return new Response("Not found", { status: 404 });
  const photo = await (await getStore()).getPhoto(id);
  if (!photo) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(photo.data), {
    headers: {
      "Content-Type": photo.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
