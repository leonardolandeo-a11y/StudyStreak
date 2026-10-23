import type {
    TrackingLink
} from "../../types/trackingLink";

interface TrackingLinkCardProps {
    trackingLink: TrackingLink;
    currentUserId: number;
}

function TrackingLinkCard({trackingLink,currentUserId}: TrackingLinkCardProps) {

    const isRequester = trackingLink.requesterId === currentUserId;

    const otherUserId = isRequester? trackingLink.receiverId : trackingLink.requesterId;

    return (
    <article
        className="
            rounded-2xl
            border border-slate-800
            bg-slate-900/70
            p-5
            shadow-lg shadow-black/10
            transition
            hover:-translate-y-0.5
            hover:border-slate-700
        "
    >
        <div
            className="
                flex flex-wrap
                items-start
                justify-between
                gap-4
            "
        >
            <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                    Tracking connection
                </p>

                <h2 className="mt-1 text-xl font-semibold text-slate-100">
                    User {otherUserId}
                </h2>
            </div>

            <span
                className={`
                    rounded-full
                    px-3 py-1
                    text-xs font-semibold
                    ${
                        trackingLink.status === "ACCEPTED"
                            ? "bg-emerald-950/60 text-emerald-300"
                            : trackingLink.status === "REJECTED"
                            ? "bg-red-950/60 text-red-300"
                            : "bg-amber-950/60 text-amber-300"
                    }
                `}
            >
                {trackingLink.status}
            </span>
        </div>


        <div
            className="
                mt-5
                rounded-xl
                border border-slate-800
                bg-slate-950/50
                p-4
            "
        >
            <p className="text-sm text-slate-300">
                {isRequester
                    ? "You sent this tracking request."
                    : "You received this tracking request."}
            </p>
        </div>
    </article>
    );
}

export default TrackingLinkCard;