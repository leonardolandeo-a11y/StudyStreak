import type { ReactNode } from "react";
import { ProfileAvatar } from "./ProfileAvatar";
import { PresenceDot, PresenceStatus, JoinedDate } from "../social/PresenceStatus";
import type { Presence } from "../../services/socialService";

export function ProfileIdentity({ name, username, bio, avatarUrl, bannerUrl, presence, registrationDate, bannerAction, editAction, onAvatarClick, showPresenceDot = true, emphasizePresence = false, children }: {
    name: string; username: string; bio: string | null; avatarUrl?: string; bannerUrl?: string;
    presence?: Presence | null; registrationDate?: string | null; bannerAction?: ReactNode; editAction?: ReactNode;
    showPresenceDot?: boolean; emphasizePresence?: boolean; onAvatarClick?: () => void; children?: ReactNode;
}) {
    const avatar = <><ProfileAvatar name={name} src={avatarUrl} className="size-24 text-3xl sm:size-28" />{showPresenceDot && <PresenceDot presence={presence} />}</>;
    return <section aria-label="Profile identity" className="overflow-hidden rounded-panel border border-outline bg-surface">
        <div className="relative h-36 bg-linear-to-br from-accent-soft via-surface-hover to-surface sm:h-48">
            {bannerUrl && <img src={bannerUrl} alt="Profile banner" className="size-full object-cover" />}{bannerAction}
        </div>
        <div className="px-4 pb-6 sm:px-6"><div className="flex flex-wrap items-end justify-between gap-3">
            {onAvatarClick ? <button type="button" aria-label="Change avatar" title="Change avatar" onClick={onAvatarClick} className="relative -mt-10 rounded-full border-4 border-surface bg-surface">{avatar}</button>
                : <div className="relative -mt-10 rounded-full border-4 border-surface bg-surface">{avatar}</div>}{editAction}
        </div>
            <h2 className="mt-4 break-words text-2xl font-bold sm:text-3xl">{name}</h2>
            <p className="mt-1 break-all text-sm text-content-muted">@{username}</p>
            <PresenceStatus presence={presence} emphasize={emphasizePresence} /><JoinedDate date={registrationDate} />
            <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-content-secondary">{bio || 'No bio yet.'}</p>
            {children}
        </div>
    </section>;
}
