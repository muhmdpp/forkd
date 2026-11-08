"use client";
import { uploadPhoto } from "@/app/actions";

const MAX_EDGE = 1600;
const MAX_BYTES = 850 * 1024;

/** Shrinks a photo in the browser so uploads stay small on mobile data, then uploads it. */
export async function resizeAndUpload(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("That file isn't a photo.");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("Couldn't read that photo. Try a JPG or PNG.");
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  let blob: Blob | null = null;
  for (const q of [0.82, 0.72, 0.6, 0.5]) {
    blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", q));
    if (blob && blob.size <= MAX_BYTES) break;
  }
  if (!blob || blob.size > MAX_BYTES) throw new Error("That photo is too large even after shrinking it.");

  const form = new FormData();
  form.append("photo", new File([blob], "photo.jpg", { type: "image/jpeg" }));
  const res = await uploadPhoto(form);
  if (!res?.url) throw new Error(res?.error ?? "Upload failed. Try again.");
  return res.url;
}
