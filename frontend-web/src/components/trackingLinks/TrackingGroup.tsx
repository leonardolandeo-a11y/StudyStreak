import { useId, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export function TrackingGroup({ title, count, expanded, onToggle, children }: {
    title: string; count: number; expanded: boolean; onToggle(): void; children: ReactNode;
}) {
    const id = useId();
    return <section className="min-w-0 rounded-xl border border-outline bg-surface/40">
        <h2><button type="button" aria-expanded={expanded} aria-controls={id} onClick={onToggle}
            className="flex min-h-14 w-full items-center gap-3 rounded-control px-4 py-3 text-left font-semibold text-content hover:bg-surface-hover">
            <ChevronDown size={20} aria-hidden="true" style={{ transform: expanded ? undefined : 'rotate(-90deg)' }}/>
            <span className="min-w-0 flex-1">{title}</span><span className="rounded-full bg-surface-hover px-2 py-1 text-xs text-content-muted">{count}</span>
        </button></h2>
        <div id={id} hidden={!expanded} className="px-3 pb-3 sm:px-4 sm:pb-4">{children}</div>
    </section>;
}
