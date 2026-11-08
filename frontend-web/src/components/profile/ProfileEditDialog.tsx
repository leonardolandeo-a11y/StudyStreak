import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { useProfile } from "../../hooks/useProfile";
import { useObjectUrl } from "../../hooks/useObjectUrl";
import { deleteProfileImage, patchProfile, putProfileImage } from "../../services/profileService";
import { normalizeProfileName, profileImageError, profileTextError, unicodeLength } from "../../utils/profileValidation";
import { getApiErrorMessage } from "../../utils/apiError";
import type { ProfileImageSlot, UserProfile } from "../../types/profile";
import { ProfileAvatar } from "./ProfileAvatar";

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
        if (initialField) dialog.current?.querySelector<HTMLInputElement>(`[data-image-slot="${initialField}"]`)?.focus();
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
            const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), textarea:not(:disabled)"));
            const first = controls[0], last = controls.at(-1);
            if (!first) { event.preventDefault(); return; }
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }}
        className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-panel border border-outline-strong bg-surface p-5 text-content shadow-2xl backdrop:bg-black/60">
        <form onSubmit={event => { event.preventDefault(); void save(); }} aria-busy={saving}>
            <div className="flex items-center justify-between gap-3"><h2 id={titleId} className="text-xl font-semibold">Edit profile</h2>
                <button type="button" className="study-button size-11 p-0" aria-label="Close edit profile" disabled={saving} onClick={close}><X size={18} aria-hidden="true" /></button></div>
            <p id={descriptionId} className="mt-2 text-sm text-content-muted">Make this space yours. Changes are saved only when you choose Save changes.</p>
            <fieldset disabled={saving} className="mt-5 min-w-0 space-y-5">
                <div className="relative h-28 overflow-hidden rounded-panel border border-outline bg-linear-to-br from-accent-soft via-surface-hover to-surface">
                    {banner && <img src={banner} alt="Banner preview" className="size-full object-cover" />}
                </div>
                <div className="-mt-12 ml-4 w-fit rounded-full border-4 border-surface bg-surface"><ProfileAvatar name={normalizeProfileName(displayName) || profile.username} src={avatar} className="size-20 text-2xl" /></div>
                {(["avatar", "banner"] as const).map(slot => <div key={slot} className="rounded-control border border-outline p-3">
                    <label className="block text-sm font-medium" htmlFor={`${titleId}-${slot}`}><ImagePlus size={16} className="mr-2 inline" aria-hidden="true" />{slot === "avatar" ? "Avatar" : "Banner"}</label>
                    <p id={`${titleId}-${slot}-help`} className="mt-1 text-xs text-content-muted">PNG, JPEG or WebP · up to {slot === "avatar" ? 2 : 5} MiB. Server checks image contents.</p>
                    <input id={`${titleId}-${slot}`} data-image-slot={slot} type="file" accept="image/png,image/jpeg,image/webp"
                        aria-describedby={`${titleId}-${slot}-help`} onChange={event => { select(slot, event.target.files?.[0]); event.target.value = ""; }}
                        className="mt-2 block min-h-11 w-full min-w-0 rounded-control border border-outline-strong bg-canvas p-2 text-xs file:mr-2 file:rounded-control file:border-0 file:bg-surface-hover file:p-2 file:text-content" />
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        {draft[slot] instanceof File && <span className="min-w-0 break-all text-content-muted">New {slot} selected</span>}
                        {draft[slot] === "remove" && <span className="text-content-muted">Will be removed when saved.</span>}
                        {(draft[slot] instanceof File || (slot === "avatar" ? shared.avatarUrl : shared.bannerUrl)) && draft[slot] !== "remove" &&
                            <button type="button" className="study-button text-xs" onClick={() => setDraft(previous => ({ ...previous, [slot]: "remove" }))}>Remove {slot}</button>}
                        {draft[slot] !== null && <button type="button" className="study-button text-xs" onClick={() => setDraft(previous => ({ ...previous, [slot]: null }))}>Undo {slot} change</button>}
                    </div>
                </div>)}
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
