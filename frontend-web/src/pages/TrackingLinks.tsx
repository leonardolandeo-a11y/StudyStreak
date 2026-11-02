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
            />
        );
    }

    if (!currentUser) return null;

    return (
        <div className="space-y-8">
            <header>
                <p className="text-sm font-medium text-sky-400">Connections</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-100">Tracking Links</h1>
                <p className="mt-2 max-w-2xl text-slate-400">Send requests, manage invitations and review your study partners.</p>
            </header>

            <TrackingLinkForm onSubmit={handleCreate} loading={creating} />
            {loading && <LoadingState message="Loading tracking connections..." />}
            {error && <ErrorMessage message={error} />}
            {error && (
                <button
                    type="button"
                    onClick={() => setRevision((value) => value + 1)}
                    className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400"
                >
                    Retry
                </button>
            )}

            {!loading && !error && pendingLinks && (
                <section>
                    <h2 className="text-xl font-semibold text-slate-100">Pending Invitations</h2>
                    <p className="mt-1 text-sm text-slate-400">Requests waiting for your response.</p>
                    {pendingLinks.empty ? (
                        <div className="mt-4"><EmptyState message="No pending invitations." /></div>
                    ) : (
                        <div className="mt-5 grid gap-4 lg:grid-cols-2">
                            {pendingLinks.content.map((link) => (
                                <article key={link.id} className="rounded-2xl border border-amber-900/40 bg-amber-950/10 p-5">
                                    <p className="text-sm text-slate-200">
                                        <span className="font-semibold">@{link.requesterUsername || "Unknown user"}</span> sent you a tracking request.
                                    </p>
                                    <div className="mt-4 flex flex-wrap gap-3">
                                        <button
                                            type="button"
                                            disabled={busyId !== null}
                                            onClick={() => handleStatus(link.id, "ACCEPTED")}
                                            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                                        >Accept</button>
                                        <button
                                            type="button"
                                            disabled={busyId !== null}
                                            onClick={() => handleStatus(link.id, "REJECTED")}
                                            className="rounded-lg border border-red-900 bg-red-950/30 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-950/60 disabled:opacity-50"
                                        >Reject</button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                    {pagination("pendingPage", pendingPageNumber, pendingLinks)}
                </section>
            )}

            {!loading && !error && activeLinks && (
                <section>
                    <h2 className="text-xl font-semibold text-slate-100">Active Tracking Links</h2>
                    <p className="mt-1 text-sm text-slate-400">Partners currently connected to your progress.</p>
                    {activeLinks.empty ? (
                        <div className="mt-4"><EmptyState message="No active connections." /></div>
                    ) : (
                        <div className="mt-5 grid gap-4 lg:grid-cols-2">
                            {activeLinks.content.map((link) => {
                                const partnerName = link.requesterId === currentUser.id ? link.receiverUsername : link.requesterUsername;
                                return (
                                    <article key={link.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                                        <p className="text-xs uppercase tracking-wide text-slate-500">Tracking with</p>
                                        <p className="mt-1 text-lg font-semibold text-slate-100">@{partnerName || "Unknown user"}</p>
                                        <span className="mt-2 inline-block rounded-full bg-emerald-950/60 px-3 py-1 text-xs font-semibold text-emerald-300">ACCEPTED</span>
                                        <button
                                            type="button"
                                            disabled={busyId !== null}
                                            onClick={() => handleRemove(link.id)}
                                            className="mt-4 block rounded-lg border border-red-900 bg-red-950/30 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-950/60 disabled:opacity-50"
                                        >Remove Tracking Link</button>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                    {pagination("activePage", activePageNumber, activeLinks)}
                </section>
            )}

            {!loading && !error && allLinks && (
                <section>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-100">All Tracking Links</h2>
                            <p className="mt-1 text-sm text-slate-400">Complete history of your tracking connections.</p>
                        </div>
                        <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-400">{allLinks.totalElements} total</span>
                    </div>
                    {allLinks.empty ? (
                        <div className="mt-4"><EmptyState message="No tracking links yet." /></div>
                    ) : (
                        <div className="mt-5 grid gap-4 lg:grid-cols-2">
                            {allLinks.content.map((link) => (
                                <TrackingLinkCard key={link.id} trackingLink={link} currentUserId={currentUser.id} />
                            ))}
                        </div>
                    )}
                    {pagination("page", page, allLinks)}
                </section>
            )}
        </div>
    );
}

export default TrackingLinks;
