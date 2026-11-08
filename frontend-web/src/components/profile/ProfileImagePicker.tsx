import { useId, useRef } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import type { ProfileImageSlot } from "../../types/profile";

export function ProfileImagePicker({ slot, file, removed, removable, changed, onSelect, onRemove, onUndo }: {
    slot: ProfileImageSlot; file: File | null; removed: boolean; removable: boolean; changed: boolean;
    onSelect: (file?: File) => void; onRemove: () => void; onUndo: () => void;
}) {
    const id = useId();
    const input = useRef<HTMLInputElement>(null);
    const label = slot === "avatar" ? "Avatar" : "Banner";
    return <div className="min-w-0 rounded-control border border-outline p-3" role="group" aria-labelledby={`${id}-label`}>
        <p id={`${id}-label`} className="text-sm font-medium">{label}</p>
        <p id={`${id}-help`} className="mt-1 text-xs text-content-muted">PNG, JPEG or WebP · up to {slot === "avatar" ? 2 : 5} MiB. Server checks image contents.</p>
        <input ref={input} id={id} hidden data-image-slot={slot} type="file" accept="image/png,image/jpeg,image/webp"
            aria-label={`Select ${slot} file`} aria-describedby={`${id}-help`}
            onChange={event => { onSelect(event.target.files?.[0]); event.target.value = ""; }} />
        <div className="mt-3 flex items-center gap-2">
            <button type="button" data-image-picker={slot} className="study-button profile-file-button min-w-0 flex-1 gap-1 px-1 sm:gap-2 sm:px-2" aria-label={`Select ${slot} file`} aria-describedby={`${id}-help`} onClick={() => input.current?.click()}>
                <ImagePlus size={16} className="shrink-0" aria-hidden="true" />Select file
            </button>
            <button type="button" className="study-button profile-remove-button min-w-0 flex-1 gap-1 px-1 sm:gap-2 sm:px-2" aria-label={`Remove ${slot}`} disabled={!removable || removed} onClick={onRemove}>
                <Trash2 size={16} aria-hidden="true" /><span>Remove<span className="sr-only"> {slot}</span></span>
            </button>
        </div>
        <p role="status" className="mt-2 truncate text-xs text-content-muted" title={file?.name}>{file?.name || (removed ? "Will be removed when saved." : "No new file selected.")}</p>
        {changed && <button type="button" className="study-button mt-2 text-xs" onClick={onUndo}>Undo {slot} change</button>}
    </div>;
}
