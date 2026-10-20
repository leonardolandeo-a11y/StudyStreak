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
        <div className="border p-4">
            <h2 className="text-xl font-bold">
                User {otherUserId}
            </h2>

            <p>
                Status: {trackingLink.status}
            </p>

            <p>
                {isRequester? "You sent this tracking request.": "You received this tracking request."}
            </p>
        </div>
    );
}

export default TrackingLinkCard;