import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useObjectUrl } from "../../hooks/useObjectUrl";
import type { StudyPartner } from "../../hooks/useStudyPartners";
import { socialProfilePath } from "../../routes/paths";
import { ProfileAvatar } from "../profile/ProfileAvatar";
import { PresenceDot, PresenceStatus } from "./PresenceStatus";

export function StudyPartnerRow({ partner, onNavigate, loadAvatar }: {
    partner: StudyPartner; onNavigate: () => void; loadAvatar: (id: number, signal: AbortSignal) => Promise<Blob | null>;
}) {
    const statusId = useId();
    const row = useRef<HTMLLIElement>(null);
    const [image, setImage] = useState<Blob | null>(null);
    const [error, setError] = useState(false), [attempt, setAttempt] = useState(0);
    const src = useObjectUrl(image);
    useEffect(() => {
        if (!partner.profileReady) return;
        const controller = new AbortController();
        const observer = new IntersectionObserver(entries => {
            if (!entries.some(entry => entry.isIntersecting)) return;
            observer.disconnect();
            void loadAvatar(partner.id, controller.signal).then(blob => {
                if (!controller.signal.aborted) { setImage(blob); setError(false); }
            }).catch(() => { if (!controller.signal.aborted) setError(true); });
        }, { root: row.current?.closest("[data-partners-scroll]"), rootMargin: "40px" });
        if (row.current) observer.observe(row.current);
        return () => { controller.abort(); observer.disconnect(); };
    }, [partner.id, partner.profileReady, loadAvatar, attempt]);
    return <li ref={row} className="min-w-0">
        <Link to={socialProfilePath(partner.id)} onClick={onNavigate} className="partners-member-link flex min-h-16 min-w-0 items-start gap-3 rounded-control p-2 hover:bg-surface-hover" aria-label={`View profile of ${partner.name}`} aria-describedby={statusId}>
            <span className="relative mt-1 shrink-0"><ProfileAvatar name={partner.name} src={src} className="size-9" /><PresenceDot presence={partner.presence} /></span>
            <div className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-content" title={partner.name}>{partner.name}</span>
                <div id={statusId}>{partner.presence ? <><span className="sr-only">@{partner.username}</span>
                    {partner.presence.status === "HIDDEN" && <span className="block text-xs text-content-muted">Status hidden</span>}
                    <PresenceStatus presence={partner.presence} compact /></>
                    : <span className="block text-xs text-content-muted">Status unavailable</span>}</div>
            </div>
        </Link>
        {error && <div className="flex items-center justify-between gap-2 px-2 pb-2 text-xs text-content-muted"><span>Avatar unavailable</span><button className="study-button px-2 text-xs" type="button" aria-label={`Retry avatar for ${partner.name}`} onClick={() => setAttempt(value => value + 1)}>Retry</button></div>}
    </li>;
}
