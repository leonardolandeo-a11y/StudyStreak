import { AcademicSprite } from "../components/academic/AcademicSprite";
import { AcademicHeading } from "../components/academic/Academic";
import { TrackingAvatar, TrackingAvatarProvider } from "../components/trackingLinks/TrackingAvatar";
import { TrackingGroup } from "../components/trackingLinks/TrackingGroup";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import TrackingLinkCard from "../components/trackingLinks/TrackingLinkCard";
import TrackingLinkForm from "../components/trackingLinks/TrackingLinkForm";
import PaginationControls from "../components/ui/PaginationControls";
import LoadingState from "../components/ui/LoadingState";
import ErrorMessage from "../components/ui/ErrorMessage";
import EmptyState from "../components/ui/EmptyState";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { useConfirm } from "../hooks/useConfirm";
import {
    createTrackingLink,
    deleteTrackingLink,
    getActiveTrackingLinks,
    getPendingTrackingLinks,
    getTrackingLinks,
    updateTrackingLinkStatus
} from "../services/trackingLinkService";
import type { TrackingLink } from "../types/trackingLink";
import type { PageResponse } from "../types/page";
import { recoverPageParams } from "../utils/pageBounds";

interface ApiErrorResponse {
    message?: string;
}

type PageKey = "page" | "pendingPage" | "activePage";

function parsePage(value: string | null) {
    const parsed = Number(value ?? "0");
    return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function TrackingLinks() {
    const { currentUser } = useAuth();
    const { showToast } = useToast();
    const confirm = useConfirm();
    const [searchParams, setSearchParams] = useSearchParams();
    const page = parsePage(searchParams.get("page"));
    const pendingPageNumber = parsePage(searchParams.get("pendingPage"));
    const activePageNumber = parsePage(searchParams.get("activePage"));
    const [allLinks, setAllLinks] = useState<PageResponse<TrackingLink> | null>(null);
    const [pendingLinks, setPendingLinks] = useState<PageResponse<TrackingLink> | null>(null);
    const [activeLinks, setActiveLinks] = useState<PageResponse<TrackingLink> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [revision, setRevision] = useState(0);
    const [expanded, setExpanded] = useState({ active: true, pending: true, history: true });
    const toggle = (group: keyof typeof expanded) => setExpanded(previous => ({ ...previous, [group]: !previous[group] }));

    const setPage = useCallback((key: PageKey, nextPage: number) => {
        setSearchParams((previous) => {
            const updated = new URLSearchParams(previous);
            if (nextPage <= 0) {
                updated.delete(key);
            } else {
                updated.set(key, String(nextPage));
            }
            return updated;
        });
    }, [setSearchParams]);

    useEffect(() => {
        const controller = new AbortController();
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const [all, pending, active] = await Promise.all([
                    getTrackingLinks(page, 10, controller.signal),
                    getPendingTrackingLinks(pendingPageNumber, 10, controller.signal),
                    getActiveTrackingLinks(activePageNumber, 10, controller.signal)
                ]);
                if (!controller.signal.aborted) {
                    const recovered = recoverPageParams(searchParams, [
                        { key: "page", current: page, totalPages: all.totalPages },
                        { key: "pendingPage", current: pendingPageNumber, totalPages: pending.totalPages },
                        { key: "activePage", current: activePageNumber, totalPages: active.totalPages }
                    ]);
                    if (recovered !== null) {
                        setAllLinks(null);
                        setPendingLinks(null);
                        setActiveLinks(null);
                        setSearchParams(recovered, { replace: true });
                        return;
                    }
                    setAllLinks(all);
                    setPendingLinks(pending);
                    setActiveLinks(active);
                }
            } catch {
                if (!controller.signal.aborted) {
                    setError("Could not load tracking links. Please try again.");
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };
        void load();
        return () => controller.abort();
    }, [page, pendingPageNumber, activePageNumber, revision, currentUser?.id, searchParams, setSearchParams]);

    async function handleCreate(receiverId: number): Promise<boolean> {
        if (!currentUser || creating) return false;
        if (receiverId === currentUser.id) {
            showToast("You cannot send a tracking request to yourself.", "error");
            return false;
        }
        setCreating(true);
        try {
            await createTrackingLink(receiverId);
            setRevision((value) => value + 1);
            showToast("Tracking request sent successfully.", "success");
            return true;
        } catch (caughtError) {
            const response = axios.isAxiosError<ApiErrorResponse>(caughtError) ? caughtError.response : undefined;
            const message = response?.status === 409
                ? response.data?.message ?? "A tracking link already exists with this user."
                : response?.status === 404
                    ? "The selected user could not be found."
                    : "Could not create tracking request.";
            showToast(message, "error");
            return false;
        } finally {
            setCreating(false);
        }
    }

    async function handleStatus(id: number, status: "ACCEPTED" | "REJECTED") {
        if (busyId !== null) return;
        setBusyId(id);
        try {
            await updateTrackingLinkStatus(id, { status });
            setRevision((value) => value + 1);
            showToast(status === "ACCEPTED" ? "Tracking request accepted." : "Tracking request rejected.", "success");
        } catch {
            showToast("Could not update tracking request.", "error");
        } finally {
            setBusyId(null);
        }
    }

    async function handleRemove(id: number) {
        if (busyId !== null) return;
        const confirmed = await confirm({
            title: "Remove tracking link?",
            message: "This tracking connection will be removed. This cannot be undone.",
            confirmLabel: "Remove",
            cancelLabel: "Cancel",
            variant: "danger"
        });
        if (!confirmed) return;
        setBusyId(id);
        try {
            await deleteTrackingLink(id);
            setRevision((value) => value + 1);
            showToast("Tracking link removed successfully.", "success");
        } catch {
            showToast("Could not remove tracking link.", "error");
        } finally {
            setBusyId(null);
        }
    }

    function pagination(key: PageKey, currentPage: number, data: PageResponse<TrackingLink>) {
        if (data.totalPages <= 1) return null;
        return (
            <PaginationControls
                page={currentPage}
                totalPages={data.totalPages}
                first={data.first}
                last={data.last}
                onPrevious={() => setPage(key, currentPage - 1)}
                onNext={() => setPage(key, currentPage + 1)}
                onPageChange={next => setPage(key, next)} size={10} totalElements={data.totalElements}
                label={key === "activePage" ? "Active tracking links pagination" : key === "pendingPage" ? "Pending invitations pagination" : "Tracking history pagination"}
            />
        );
    }

    if (!currentUser) return null;

    return (
        <TrackingAvatarProvider revision={revision}><div className="academic-page academic-module retro-tracking space-y-4">
            <div className="tracking-toolbar"><AcademicHeading title="Tracking Links" eyebrow="Study connections" description="Send requests, manage invitations and review your study partners." glyph="people" art={<AcademicSprite name="companions" width={76}/>}/>
                <TrackingLinkForm onSubmit={handleCreate} loading={creating}/>
            </div>
            {loading && <LoadingState message="Loading tracking connections..." />}
            {error && <ErrorMessage message={error} />}
            {error && (
                <button
                    type="button"
                    onClick={() => setRevision((value) => value + 1)}
                    className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-on-accent hover:bg-sky-400"
                >
                    Retry
                </button>
            )}

            {!loading && !error && activeLinks && <TrackingGroup title="Active Tracking Links" glyph="people" count={activeLinks.totalElements} expanded={expanded.active} onToggle={() => toggle('active')}>
                {activeLinks.empty ? <EmptyState message="No active connections."/> : <div className="grid gap-3 xl:grid-cols-2">
                    {activeLinks.content.map(link => <TrackingLinkCard key={link.id} trackingLink={link} currentUserId={currentUser.id} busy={busyId !== null} onRemove={handleRemove}/>)}
                </div>}
                {pagination("activePage", activePageNumber, activeLinks)}
            </TrackingGroup>}
            {!loading && !error && pendingLinks && <TrackingGroup title="Pending Invitations" glyph="note" count={pendingLinks.totalElements} expanded={expanded.pending} onToggle={() => toggle('pending')}>
                {pendingLinks.empty ? <EmptyState message="No pending invitations."/> : <div className="grid gap-3 xl:grid-cols-2">
                    {pendingLinks.content.map(link => <article key={link.id} className="min-w-0 rounded-lg border border-outline bg-surface p-3">
                        <div className="flex min-w-0 items-center gap-3"><TrackingAvatar id={link.requesterId} name={link.requesterUsername || "?"} className="size-11"/>
                            <p className="min-w-0 flex-1 truncate font-semibold text-content">@{link.requesterUsername || "Unknown user"}</p><span className="text-xs text-warning">PENDING</span></div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <button type="button" disabled={busyId !== null} onClick={() => handleStatus(link.id, "ACCEPTED")} className="study-button bg-accent text-on-accent hover:bg-accent-hover disabled:opacity-50">Accept</button>
                            <button type="button" disabled={busyId !== null} onClick={() => handleStatus(link.id, "REJECTED")} className="study-button border-danger-outline text-danger hover:bg-danger-surface disabled:opacity-50">Reject</button>
                        </div>
                    </article>)}
                </div>}
                {pagination("pendingPage", pendingPageNumber, pendingLinks)}
            </TrackingGroup>}
            {!loading && !error && allLinks && <TrackingGroup title="All Tracking Links" glyph="book" count={allLinks.totalElements} expanded={expanded.history} onToggle={() => toggle('history')}>
                {allLinks.empty ? <EmptyState message="No tracking links yet."/> : <div className="grid gap-3 xl:grid-cols-2">
                    {allLinks.content.map(link => <TrackingLinkCard key={link.id} trackingLink={link} currentUserId={currentUser.id}/>)}
                </div>}
                {pagination("page", page, allLinks)}
            </TrackingGroup>}
        </div></TrackingAvatarProvider>
    );
}

export default TrackingLinks;
