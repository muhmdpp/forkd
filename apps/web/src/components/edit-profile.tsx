"use client";
import { useActionState, useRef, useState } from "react";
import { type ActionResult, updateProfile } from "@/app/actions";
import { resizeAndUpload } from "@/lib/photos";
import { I } from "./icons";
import { Avatar } from "./ui";

export function EditProfileForm({ profile }: { profile: { name: string; handle: string; bio: string; avatarUrl: string | null } }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(updateProfile, undefined);
  const [avatar, setAvatar] = useState(profile.avatarUrl ?? "");
  const [name, setName] = useState(profile.name);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <form action={action} className="flex flex-col gap-5 pt-2">
      <input type="hidden" name="avatarUrl" value={avatar} />
      <div className="flex items-center gap-4">
        <Avatar name={name || profile.name} src={avatar || null} size={84} />
        <div className="flex flex-col items-start gap-1">
          <button type="button" className="btn sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
            {I.camera({ width: 16, height: 16 })}
            {uploading ? "Uploading…" : avatar ? "Change photo" : "Add photo"}
          </button>
          {avatar ? (
            <button type="button" className="btn ghost sm" onClick={() => setAvatar("")}>
              Remove photo
            </button>
          ) : null}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            setUploading(true);
            setUploadError(null);
            try {
              setAvatar(await resizeAndUpload(f));
            } catch (err) {
              setUploadError((err as Error).message);
            } finally {
              setUploading(false);
            }
          }}
        />
      </div>
      {uploadError ? <p className="error">{uploadError}</p> : null}
      <label className="field">
        <span>Name</span>
        <input id="name" name="name" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required />
      </label>
      <label className="field">
        <span>Username</span>
        <input id="handle" name="handle" className="input" defaultValue={profile.handle} maxLength={20} autoCapitalize="none" autoCorrect="off" required />
      </label>
      <label className="field">
        <span>Bio</span>
        <textarea id="bio" name="bio" className="input" defaultValue={profile.bio} maxLength={160} placeholder="Biryani person. Cafe hopper. Always looking for the next good spot." />
      </label>
      {state?.error ? <p className="error" role="alert">{state.error}</p> : null}
      <button type="submit" className="btn primary wide" disabled={pending || uploading}>
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
