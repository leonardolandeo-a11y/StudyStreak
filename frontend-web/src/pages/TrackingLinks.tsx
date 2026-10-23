import {
    useEffect,
    useState
} from "react";

import {
    useSearchParams
} from "react-router-dom";

import {
    getTrackingLinks,
    createTrackingLink,
    getPendingTrackingLinks,
    updateTrackingLinkStatus,
    getActiveTrackingLinks,
    deleteTrackingLink
} from "../services/trackingLinkService";

import TrackingLinkCard
    from "../components/trackingLinks/TrackingLinkCard";
import axios from "axios";

import TrackingLinkForm from "../components/trackingLinks/TrackingLinkForm";
import { useAuth }
    from "../hooks/useAuth";

import type {
    TrackingLink
} from "../types/trackingLink";

import type {
    PageResponse
} from "../types/page";

import LoadingState from "../components/ui/LoadingState";

import ErrorMessage from "../components/ui/ErrorMessage";

import EmptyState from "../components/ui/EmptyState";

import PaginationControls from "../components/ui/PaginationControls";

interface ApiErrorResponse {
    timestamp: string;
    status: number;
    error: string;
    message: string;
    path: string;
}

function TrackingLinks() {

    const { currentUser } = useAuth();

    const [searchParams, setSearchParams] =useSearchParams();

    const [trackingPage,setTrackingPage] = useState<PageResponse<TrackingLink> | null>(null);

    const [loading, setLoading] =useState(true);

    const [error, setError] =useState<string | null>(null);

    const [creating , setCreating]  = useState(false);
    const [success, setSuccess] = useState<string|null> (null);
    const [pendingPage,setPendingPage] = useState<PageResponse<TrackingLink> | null>(null);

    const [activePage , setActivePage] = useState<PageResponse<TrackingLink>|null>(null);


    const pageParam =Number(searchParams.get("page") ?? "0");

    const page =Number.isInteger(pageParam) && pageParam >= 0 ? pageParam: 0;

    function goToPreviousPage() {
        if (page <= 0) {
            return;
        }

        setSearchParams({
            page: String(page - 1)
        });
    }

    function goToNextPage() {
        if (!trackingPage ||trackingPage.last) {
            return;
        }

        setSearchParams({
            page: String(page + 1)
        });
    }
    async function handleCreateTrackingLink(receiverId: number): Promise<boolean> {

        if (!currentUser) {
            return false;
        }

        if (receiverId === currentUser.id) {
            setError("You cannot create a tracking link with yourself.");
            return false;
        }

        try {
            setCreating(true);
            setError(null);
            setSuccess(null);

            await createTrackingLink(receiverId);

            const updatedLinks = await getTrackingLinks(page, 10);

            setTrackingPage(updatedLinks);

            setSuccess("Tracking request sent successfully.");

            return true;

        } catch (caughtError) {

            if (axios.isAxiosError<ApiErrorResponse>(caughtError)) {
                const status = caughtError.response?.status;

                if (status === 409) {
                    setError(caughtError.response?.data?.message ??"A tracking link already exists with this user.");
                } else if (status === 404) {
                    setError("The selected user does not exist.");
                } else {
                    setError("Could not create tracking request.");
                }

            } else {
                setError("Could not create tracking request.");
            }

            return false;

        } finally {
            setCreating(false);
        }
    }
    async function handleTrackingStatus(trackingId: number,status: "ACCEPTED" | "REJECTED") {
        try {
            setError(null);
            setSuccess(null);

            await updateTrackingLinkStatus(trackingId,{ status });

            const [updatedLinks,updatedPending, updatedActive] = await Promise.all([
                getTrackingLinks(page, 10),
                getPendingTrackingLinks(0, 10),
                getActiveTrackingLinks(0,10)
            ]);

            setTrackingPage(updatedLinks);
            setPendingPage(updatedPending);
            setActivePage(updatedActive);

            setSuccess(status === "ACCEPTED"? "Tracking request accepted.": "Tracking request rejected.");

        } catch {
            setError(
                "Could not update tracking request."
            );
        }
    }
    async function handleDeleteTrackingLink(trackingId: number) {
        const confirmed = window.confirm("Remove this tracking link?");

        if (!confirmed) {
            return;
        }

        try {
            setError(null);
            setSuccess(null);

            await deleteTrackingLink(trackingId);

            const [updatedLinks,updatedPending,updatedActive] = await Promise.all([
                getTrackingLinks(page, 10),
                getPendingTrackingLinks(0, 10),
                getActiveTrackingLinks(0, 10)
            ]);

            setTrackingPage(updatedLinks);
            setPendingPage(updatedPending);
            setActivePage(updatedActive);

            setSuccess("Tracking link removed successfully.");

        } catch {
            setError("Could not remove tracking link.");
        }
    }
    useEffect(() => {

        const controller =new AbortController();


        async function loadTrackingLinks() {

            try {

                setLoading(true);
                setError(null);

                const [allLinks,pendingLinks,activeLinks] = await Promise.all([
                        getTrackingLinks(page,10,controller.signal),
                        getPendingTrackingLinks(0,10,controller.signal),
                        getActiveTrackingLinks(0,10,controller.signal)
                ]);


                setTrackingPage(allLinks);
                setPendingPage(pendingLinks);
                setActivePage(activeLinks);

            } catch {

                if (!controller.signal.aborted) {
                    setError("Could not load tracking links.");
                }

            } finally {

                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }


        void loadTrackingLinks();


        return () => {
            controller.abort();
        };

    }, [page]);

    if (!currentUser) {
        return null;
    }

    if (loading) {
        return (
            <LoadingState
                message="Loading tracking links..."
            />
        );
    }

    if (error && !trackingPage) {
        return (
            <ErrorMessage
                message={error}
            />
        );
    }

    if (!trackingPage) {
        return null;
    }

    return (
    <div className="space-y-8">

        <section>
            <p className="text-sm font-medium text-sky-400">
                Connections
            </p>

            <h1
                className="
                    mt-2
                    text-3xl font-bold
                    tracking-tight
                    text-slate-100
                "
            >
                Tracking Links
            </h1>

            <p className="mt-2 max-w-2xl text-slate-400">
                Send tracking requests, manage invitations,
                and review your active study connections.
            </p>
        </section>


        <section>
            <TrackingLinkForm
                onSubmit={handleCreateTrackingLink}
                loading={creating}
            />
        </section>


        {success && (
            <div
                className="
                    rounded-xl
                    border border-emerald-900/60
                    bg-emerald-950/40
                    px-4 py-3
                    text-sm text-emerald-300
                "
            >
                {success}
            </div>
        )}


        {error && trackingPage && (
            <ErrorMessage
                message={error}
            />
        )}


        {pendingPage && !pendingPage.empty && (
            <section>
                <div className="mb-5">
                    <h2 className="text-xl font-semibold text-slate-100">
                        Pending Invitations
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                        Requests waiting for your response.
                    </p>
                </div>


                <div className="grid gap-4 lg:grid-cols-2">
                    {pendingPage.content.map(
                        (trackingLink) => (
                            <article
                                key={trackingLink.id}
                                className="
                                    rounded-2xl
                                    border border-amber-900/40
                                    bg-amber-950/10
                                    p-5
                                "
                            >
                                <p className="text-sm text-slate-300">
                                    User{" "}
                                    <span className="font-semibold text-slate-100">
                                        {trackingLink.requesterId}
                                    </span>{" "}
                                    sent you a tracking request.
                                </p>

                                <div className="mt-4 flex flex-wrap gap-3">

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleTrackingStatus(
                                                trackingLink.id,
                                                "ACCEPTED"
                                            )
                                        }
                                        className="
                                            rounded-lg
                                            bg-emerald-500
                                            px-4 py-2
                                            text-sm font-semibold
                                            text-slate-950
                                            hover:bg-emerald-400
                                        "
                                    >
                                        Accept
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleTrackingStatus(
                                                trackingLink.id,
                                                "REJECTED"
                                            )
                                        }
                                        className="
                                            rounded-lg
                                            border border-red-900
                                            bg-red-950/30
                                            px-4 py-2
                                            text-sm font-medium
                                            text-red-300
                                            hover:bg-red-950/60
                                        "
                                    >
                                        Reject
                                    </button>

                                </div>
                            </article>
                        )
                    )}
                </div>
            </section>
        )}


        {activePage && !activePage.empty && (
            <section>
                <div className="mb-5">
                    <h2 className="text-xl font-semibold text-slate-100">
                        Active Tracking Links
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                        Users currently connected to your progress.
                    </p>
                </div>


                <div className="grid gap-4 lg:grid-cols-2">
                    {activePage.content.map(
                        (trackingLink) => {

                            const otherUserId =
                                trackingLink.requesterId === currentUser.id
                                    ? trackingLink.receiverId
                                    : trackingLink.requesterId;

                            return (
                                <article
                                    key={trackingLink.id}
                                    className="
                                        rounded-2xl
                                        border border-slate-800
                                        bg-slate-900/70
                                        p-5
                                    "
                                >
                                    <div
                                        className="
                                            flex
                                            flex-wrap
                                            items-start
                                            justify-between
                                            gap-4
                                        "
                                    >
                                        <div>
                                            <p className="text-xs uppercase tracking-wide text-slate-500">
                                                Tracking with
                                            </p>

                                            <p className="mt-1 text-lg font-semibold text-slate-100">
                                                User {otherUserId}
                                            </p>
                                        </div>

                                        <span
                                            className="
                                                rounded-full
                                                bg-emerald-950/60
                                                px-3 py-1
                                                text-xs font-semibold
                                                text-emerald-300
                                            "
                                        >
                                            {trackingLink.status}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleDeleteTrackingLink(
                                                trackingLink.id
                                            )
                                        }
                                        className="
                                            mt-5
                                            rounded-lg
                                            border border-red-900
                                            bg-red-950/30
                                            px-4 py-2
                                            text-sm font-medium
                                            text-red-300
                                            hover:bg-red-950/60
                                        "
                                    >
                                        Remove Tracking Link
                                    </button>
                                </article>
                            );
                        }
                    )}
                </div>
            </section>
        )}


        <section>
            <div
                className="
                    mb-5
                    flex flex-wrap
                    items-end
                    justify-between
                    gap-3
                "
            >
                <div>
                    <h2 className="text-xl font-semibold text-slate-100">
                        All Tracking Links
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                        Complete history of your tracking connections.
                    </p>
                </div>

                {!trackingPage.empty && (
                    <span
                        className="
                            rounded-full
                            border border-slate-800
                            bg-slate-900
                            px-3 py-1
                            text-xs font-medium
                            text-slate-400
                        "
                    >
                        {trackingPage.totalElements} total
                    </span>
                )}
            </div>


            {trackingPage.empty && (
                <EmptyState
                    message="No tracking links yet."
                />
            )}


            {!trackingPage.empty && (
                <div className="grid gap-4 lg:grid-cols-2">
                    {trackingPage.content.map(
                        (trackingLink) => (
                            <TrackingLinkCard
                                key={trackingLink.id}
                                trackingLink={trackingLink}
                                currentUserId={currentUser.id}
                            />
                        )
                    )}
                </div>
            )}


            {!trackingPage.empty && (
                <PaginationControls
                    page={page}
                    totalPages={trackingPage.totalPages}
                    first={trackingPage.first}
                    last={trackingPage.last}
                    onPrevious={goToPreviousPage}
                    onNext={goToNextPage}
                />
            )}
        </section>

    </div>
    );
}

export default TrackingLinks;