import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import { useProfile } from "../../hooks/useProfile";
import { useObjectUrl } from "../../hooks/useObjectUrl";
import { deleteProfileImage, patchProfile, putProfileImage } from "../../services/profileService";
import { normalizeProfileName, profileImageError, profileTextError, unicodeLength } from "../../utils/profileValidation";
import { getApiErrorMessage } from "../../utils/apiError";
import type { ProfileImageSlot, UserProfile } from "../../types/profile";
import { ProfileAvatar } from "./ProfileAvatar";
import { ProfileImagePicker } from "./ProfileImagePicker";

type ImageDraft = File | "remove" | null;
export function ProfileEditDialog({ profile, initialField, onClose, onSaved }: {
    profile: UserProfile; initialField?: ProfileImageSlot; onClose: () => void; onSaved: () => void;
}) {
    const shared = useProfile()!;
    const dialog = useRef<HTMLDialogElement>(null);
    const titleId = useId(), descriptionId = useId(), nameId = useId(), bioId = useId();
    const [displayName, setDisplayName] = useState(profile.displayName ?? "");
    const [bio, setBio] = useState(profile.bio ?? "");
    const [draft, setDraft] = useState<Record<ProfileImageSlot, ImageDraft>>({ avatar: null, banner: null });
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const previewAvatar = useObjectUrl(draft.avatar instanceof File ? draft.avatar : null);
    const previewBanner = useObjectUrl(draft.banner instanceof File ? draft.banner : null);
    const avatar = draft.avatar === "remove" ? undefined : previewAvatar ?? shared.avatarUrl;
    const banner = draft.banner === "remove" ? undefined : previewBanner ?? shared.bannerUrl;
    const validation = profileTextError(displayName, bio);
    useEffect(() => {
        dialog.current?.showModal();
        if (initialField) dialog.current?.querySelector<HTMLButtonElement>(`[data-image-picker="${initialField}"]`)?.focus();
    }, [initialField]);
    function close() { if (!saving) { dialog.current?.close(); onClose(); } }
    function select(slot: ProfileImageSlot, file?: File) {
        if (!file) return;
        const invalid = profileImageError(slot, file);
        if (invalid) { setError(invalid); return; }
        setDraft(previous => ({ ...previous, [slot]: file })); setError(null);
    }
    async function save() {
        if (validation) { setError(validation); return; }
        setSaving(true); setError(null);
        try {
            await patchProfile({ displayName: normalizeProfileName(displayName) || null, bio: bio || null });
            for (const slot of ["avatar", "banner"] as const) {
                const change = draft[slot];
                if (change === "remove") await deleteProfileImage(slot);
                else if (change) await putProfileImage(slot, change);
            }
            await shared.refresh();
            onSaved(); dialog.current?.close(); onClose();
        } catch (failure) {
            await shared.refresh();
            setError(`${getApiErrorMessage(failure, "Could not save profile. The image may be corrupt or unsupported.")} Some changes may already be saved. Review your profile and retry.`);
        } finally { setSaving(false); }
    }
    return <dialog ref={dialog} aria-labelledby={titleId} aria-describedby={descriptionId}
        onCancel={event => { event.preventDefault(); close(); }}
        onKeyDown={event => {
            if (event.key !== "Tab") return;
            const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled):not([hidden]), textarea:not(:disabled)"));
            const first = controls[0], last = controls.at(-1);
            if (!first) { event.preventDefault(); return; }
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }}
        className="academic-page academic-module fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-panel border border-outline-strong bg-surface p-5 text-content shadow-2xl backdrop:bg-black/60">
        <form onSubmit={event => { event.preventDefault(); void save(); }} aria-busy={saving}>
            <div className="flex items-center justify-between gap-3"><h2 id={titleId} className="text-xl font-semibold">Edit profile</h2>
                <button type="button" className="study-button size-11 p-0" aria-label="Close edit profile" disabled={saving} onClick={close}><X size={18} aria-hidden="true" /></button></div>
            <p id={descriptionId} className="mt-2 text-sm text-content-muted">Make this space yours. Changes are saved only when you choose Save changes.</p>
            <fieldset disabled={saving} className="mt-5 min-w-0 space-y-5">
                <div className="profile-editor-preview">
                    <div className="h-28 overflow-hidden rounded-panel border border-outline bg-linear-to-br from-accent-soft via-surface-hover to-surface">
                        {banner && <img src={banner} alt="Banner preview" className="size-full object-cover" />}
                    </div>
                    <div className="relative -mt-10 ml-4 w-fit rounded-full border-4 border-surface bg-surface"><ProfileAvatar name={normalizeProfileName(displayName) || profile.username} src={avatar} className="size-20 text-2xl" /></div>
                </div>
                {(["avatar", "banner"] as const).map(slot => <ProfileImagePicker key={slot} slot={slot}
                    file={draft[slot] instanceof File ? draft[slot] : null} removed={draft[slot] === "remove"}
                    removable={draft[slot] instanceof File || !!(slot === "avatar" ? shared.avatarUrl : shared.bannerUrl)} changed={draft[slot] !== null}
                    onSelect={file => select(slot, file)}
                    onRemove={() => setDraft(previous => ({ ...previous, [slot]: "remove" }))}
                    onUndo={() => setDraft(previous => ({ ...previous, [slot]: null }))} />)}
                <div><label htmlFor={nameId} className="text-sm font-medium">Display name</label>
                    <input id={nameId} autoComplete="nickname" value={displayName} onChange={event => setDisplayName(event.target.value)}
                        aria-describedby={`${nameId}-help`} className="mt-2 min-h-11 w-full rounded-control border border-outline-strong bg-canvas px-3 text-content" />
                    <p id={`${nameId}-help`} className="mt-1 text-xs text-content-muted">{unicodeLength(normalizeProfileName(displayName))}/60 characters · leave empty to use {profile.username}.</p></div>
                <div><label htmlFor={bioId} className="text-sm font-medium">Bio</label>
                    <textarea id={bioId} rows={3} value={bio} onChange={event => setBio(event.target.value)} aria-describedby={`${bioId}-help`}
                        className="mt-2 w-full resize-y rounded-control border border-outline-strong bg-canvas p-3 text-content" />
                    <p id={`${bioId}-help`} className="mt-1 text-xs text-content-muted">{unicodeLength(bio)}/300 characters · plain text.</p></div>
            </fieldset>
            {(error || validation) && <p role="alert" className="mt-4 rounded-control border border-danger-outline bg-danger-surface p-3 text-sm text-danger">{error || validation}</p>}
            <div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" className="study-button" disabled={saving} onClick={close}>Cancel</button>
                <button type="submit" disabled={saving || !!validation} className="study-button border-accent bg-accent text-on-accent hover:bg-accent-hover">{saving ? "Saving…" : "Save changes"}</button></div>
        </form>
    </dialog>;
}
