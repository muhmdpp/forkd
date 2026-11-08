import type { Metadata } from "next";
import { EditProfileForm } from "@/components/edit-profile";
import { BackBar } from "@/components/ui";
import { requireViewer } from "@/lib/data";

export const metadata: Metadata = { title: "Edit profile" };
export const dynamic = "force-dynamic";

export default async function EditProfile() {
  const viewer = await requireViewer("/settings/profile");
  return (
    <main className="page cream">
      <BackBar href={`/u/${viewer.handle}`} title="Edit profile" />
      <div className="wrap pb-12">
        <EditProfileForm profile={{ name: viewer.name, handle: viewer.handle, bio: viewer.bio, avatarUrl: viewer.avatarUrl }} />
      </div>
    </main>
  );
}
