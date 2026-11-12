import { Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { socialProfilePath } from "../../routes/paths";
import { TrackingAvatar } from "./TrackingAvatar";
import type { TrackingLink } from "../../types/trackingLink";

export default function TrackingLinkCard({ trackingLink, currentUserId, onRemove, busy = false }: {
    trackingLink: TrackingLink; currentUserId: number; onRemove?: (id: number) => void; busy?: boolean;
}) {
    const isRequester = trackingLink.requesterId === currentUserId;
    const partnerId = isRequester ? trackingLink.receiverId : trackingLink.requesterId;
    const name = (isRequester ? trackingLink.receiverUsername : trackingLink.requesterUsername) || "Unknown user";
    const identity = <><TrackingAvatar id={partnerId} name={name} className="size-12 text-lg"/><span className="min-w-0"><span className="block truncate font-semibold text-content" title={name}>@{name}</span><span className="text-xs text-content-muted">{isRequester ? "Sent" : "Received"}</span></span></>;
    return <article className="tracking-partner flex min-w-0 items-center gap-3 rounded-lg border border-outline bg-surface p-3">
        {trackingLink.status === 'ACCEPTED'
            ? <Link to={socialProfilePath(partnerId)} aria-label={`View profile of ${name}`} className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-control hover:bg-surface-hover">{identity}</Link>
            : <div className="flex min-h-11 min-w-0 flex-1 items-center gap-3">{identity}</div>}
        <div className="flex shrink-0 flex-col items-end gap-1">
            <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${trackingLink.status === "ACCEPTED" ? "bg-success-surface text-success" : trackingLink.status === "REJECTED" ? "bg-danger-surface text-danger" : "bg-warning-surface text-warning"}`}>{trackingLink.status}</span>
            {onRemove && <button type="button" disabled={busy} onClick={() => onRemove(trackingLink.id)} aria-label={`Remove tracking link with ${name}`} title={`Remove tracking link with ${name}`}
                className="flex size-11 items-center justify-center rounded-control text-danger hover:bg-danger-surface disabled:opacity-50"><Trash2 size={19} aria-hidden="true"/></button>}
        </div>
    </article>;
}
