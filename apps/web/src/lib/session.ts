import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth, ensureProfile } from "./auth";

export interface Viewer {
  id: string;
  name: string;
  email: string;
  handle: string;
  cityId: string;
  onboarded: boolean;
}

/** The signed-in user with their profile, or null. Cached per request. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const { user } = session;
  const profile = await ensureProfile(user.id, user.name, user.email);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    handle: profile.handle,
    cityId: profile.homeCityId,
    onboarded: profile.onboardedAt !== null,
  };
});

export async function requireViewer(next = "/"): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/signin?next=${encodeURIComponent(next)}`);
  return viewer;
}
