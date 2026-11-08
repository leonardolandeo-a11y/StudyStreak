import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, RefreshCw, Users, X } from "lucide-react";
import { useStudyPartners, type StudyPartner } from "../../hooks/useStudyPartners";
import { ROUTES } from "../../routes/paths";
import { useReducedMotion } from "../../theme/appearance";
import LoadingState from "../ui/LoadingState";
import { StudyPartnerRow } from "./StudyPartnerRow";

const media = "(min-width: 1024px)";
function subscribe(notify: () => void) { const query = window.matchMedia(media); query.addEventListener("change", notify); return () => query.removeEventListener("change", notify); }
export function StudyPartnersPanel({ open, rendered, generation, userId, trigger, onClose, onExited, id }: {
    open: boolean; rendered: boolean; generation: number; userId: number; trigger: RefObject<HTMLButtonElement | null>; onClose: () => void; onExited: () => void; id: string;
}) {
    const desktop = useSyncExternalStore(subscribe, () => window.matchMedia(media).matches, () => true);
    const reduced = useReducedMotion();
    const [page, setPage] = useState(0), [revision, setRevision] = useState(0);
    const surface = useRef<HTMLElement>(null);
    const previousSurface = useRef<HTMLElement | null>(null);
    const previousOpen = useRef(false);
    const closeButton = useRef<HTMLButtonElement>(null);
    const invalidPage = useCallback(() => setPage(0), []);
    const data = useStudyPartners({ open, page, generation: generation + revision, userId, onInvalidPage: invalidPage });
    useEffect(() => {
        const element = surface.current;
        if (!element || !rendered) return;
        const newlyOpened = open && (!previousOpen.current || previousSurface.current !== element);
        previousOpen.current = open; previousSurface.current = element;
        let timer: number | undefined;
        const restore = () => {
            const visible = trigger.current?.getBoundingClientRect().width ? trigger.current : Array.from(document.querySelectorAll<HTMLButtonElement>("[data-partners-toggle]")).find(button => button.getBoundingClientRect().width > 0);
            visible?.focus();
        };
        if (open) {
            if (element instanceof HTMLDialogElement && !element.open) element.showModal();
            if (newlyOpened) closeButton.current?.focus();
        } else {
            timer = window.setTimeout(() => { if (element instanceof HTMLDialogElement) element.close(); restore(); onExited(); }, reduced ? 0 : 240);
        }
        return () => { clearTimeout(timer); };
    }, [open, desktop, reduced, trigger, rendered, onExited]);
    useEffect(() => {
        if (!open || desktop) return;
        const previous = document.body.style.overflow; document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = previous; };
    }, [open, desktop]);
    useEffect(() => {
        if (!open || !desktop) return;
        const escape = (event: KeyboardEvent) => { if (event.key === "Escape" && !document.querySelector("dialog[open]")) { event.preventDefault(); onClose(); } };
        window.addEventListener("keydown", escape); return () => window.removeEventListener("keydown", escape);
    }, [open, desktop, onClose]);
    const refresh = () => { data.clearAvatars(); setRevision(value => value + 1); };
    const sections: { label: string; matches: (item: StudyPartner) => boolean }[] = [
        { label: "Online", matches: item => item.presence?.status === "ONLINE" },
        { label: "Offline", matches: item => item.presence?.status === "OFFLINE" },
        { label: "Other partners", matches: item => !item.presence || item.presence.status === "HIDDEN" },
    ];
    const content = <div className="partners-panel-shell flex h-full min-h-0 flex-col bg-surface text-content">
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-outline px-4 py-4"><div><p className="study-kicker">Study together</p><h2 id={`${id}-title`} className="mt-1 text-lg font-semibold">Study partners</h2></div>
            <button ref={closeButton} type="button" aria-label="Close study partners" title="Close study partners" className="study-button size-11 shrink-0 p-0" onClick={onClose}><X size={18} aria-hidden="true" /></button></header>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3" data-partners-scroll>
            <div className="mb-3 flex items-center justify-between gap-2"><span className="text-xs text-content-muted">Accepted Tracking connections</span><button type="button" className="study-button size-11 shrink-0 p-0" aria-label="Refresh study partners" title="Refresh study partners" onClick={refresh} disabled={data.loading}><RefreshCw size={16} aria-hidden="true" /></button></div>
            {data.loading && <LoadingState message="Loading study partners…" />}
            {data.error && <div role="alert" className="rounded-control border border-danger-outline bg-danger-surface p-3 text-sm text-danger"><p>{data.error}</p><button type="button" className="study-button mt-3" onClick={refresh}>Retry partners</button></div>}
            {!data.loading && !data.error && data.items.length === 0 && <div className="study-empty"><Users size={24} aria-hidden="true" /><p className="mt-3">{data.total ? "No available profiles on this page." : "No study partners yet."}</p><p className="mt-2">Manage your connections in Tracking.</p></div>}
            {!data.loading && !data.error && sections.map(section => {
                const items = data.items.filter(section.matches);
                return items.length > 0 && <section key={section.label} aria-label={section.label} className="mb-4"><h3 className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-content-muted">{section.label} <span className="font-normal">· {items.length}</span></h3><ul className="space-y-1">{items.map(partner => <StudyPartnerRow key={partner.id} partner={partner} onNavigate={onClose} loadAvatar={data.loadAvatar} />)}</ul></section>;
            })}
            {data.partial && !data.error && <p role="status" className="mt-2 text-xs text-warning">Some details are unavailable. Use Refresh to retry.</p>}
        </div>
        <footer className="shrink-0 space-y-3 border-t border-outline p-3">
            {data.pages > 1 && <nav aria-label="Study partners pages" className="flex items-center justify-between gap-2"><button type="button" aria-label="Previous partners page" className="study-button size-11 p-0" disabled={data.loading || page === 0} onClick={() => setPage(value => value - 1)}><ChevronLeft size={16} aria-hidden="true" /></button><span className="text-xs text-content-muted">Page {page + 1} of {data.pages}</span><button type="button" aria-label="Next partners page" className="study-button size-11 p-0" disabled={data.loading || page + 1 >= data.pages} onClick={() => setPage(value => value + 1)}><ChevronRight size={16} aria-hidden="true" /></button></nav>}
            <Link to={ROUTES.trackingLinks} onClick={onClose} className="study-button w-full">Manage Tracking</Link>
            <p className="text-xs text-content-muted">Presence is shared by each partner. Up to 10 per page.</p>
        </footer>
    </div>;
    if (!desktop && !rendered) return null;
    return desktop ? <aside id={id} ref={node => { surface.current = node; }} className="partners-desktop" data-open={open} aria-labelledby={`${id}-title`} aria-hidden={!open} inert={!open}>{rendered ? content : null}</aside>
        : <dialog id={id} ref={node => { surface.current = node; }} aria-labelledby={`${id}-title`} className="partners-drawer" data-open={open} onKeyDown={event => {
            if (event.key !== "Tab") return;
            const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled),a[href]")).filter(node => node.getClientRects().length > 0);
            const first = controls[0], last = controls.at(-1);
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }} onCancel={event => { event.preventDefault(); onClose(); }}>{rendered ? content : null}</dialog>;
}
