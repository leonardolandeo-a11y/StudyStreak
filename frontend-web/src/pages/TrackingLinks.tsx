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
    <div className="p-6">

        <h1 className="text-3xl font-bold">
            Tracking Links
        </h1>

        <div className="mt-6">
            <TrackingLinkForm
                onSubmit={handleCreateTrackingLink}
                loading={creating}
            />
        </div>

        {success && (
            <p className="mt-4 text-green-500">
                {success}
            </p>
        )}

        {error && trackingPage && (
            <ErrorMessage
                message={error}
            />
        )}

        {pendingPage && !pendingPage.empty && (
            <div className="mt-6">
                <h2 className="text-2xl font-bold">
                    Pending Invitations
                </h2>

                <div className="mt-4 space-y-4">
                    {pendingPage.content.map(
                        (trackingLink) => (
                            <div
                                key={trackingLink.id}
                                className="border p-4"
                            >
                                <p>
                                    User {trackingLink.requesterId}
                                    {" "}sent you a tracking request.
                                </p>

                                <div className="mt-3 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleTrackingStatus(
                                                trackingLink.id,
                                                "ACCEPTED"
                                            )
                                        }
                                        className="border p-2"
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
                                        className="border p-2"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>
        )}

        {activePage && !activePage.empty && (
            <div className="mt-6">
                <h2 className="text-2xl font-bold">
                    Active Tracking Links
                </h2>

                <div className="mt-4 space-y-4">
                    {activePage.content.map(
                        (trackingLink) => {

                            const otherUserId =
                                trackingLink.requesterId === currentUser.id
                                    ? trackingLink.receiverId
                                    : trackingLink.requesterId;

                            return (
                                <div
                                    key={trackingLink.id}
                                    className="border p-4"
                                >
                                    <p>
                                        Tracking with User {otherUserId}
                                    </p>

                                    <p>
                                        Status: {trackingLink.status}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleDeleteTrackingLink(
                                                trackingLink.id
                                            )
                                        }
                                        className="mt-3 border p-2 text-red-500"
                                    >
                                        Remove Tracking Link
                                    </button>
                                </div>
                            );
                        }
                    )}
                </div>
            </div>
        )}

        {trackingPage.empty && (
            <EmptyState
                message="No tracking links yet."
            />
        )}

        {!trackingPage.empty && (
            <div className="mt-6 space-y-4">

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

    </div>
    );
}

export default TrackingLinks;