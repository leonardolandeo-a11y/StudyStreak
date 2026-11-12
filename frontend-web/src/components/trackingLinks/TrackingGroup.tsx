import { useId, type ReactNode } from "react";
import { PixelGlyph, type AcademicGlyph } from "../academic/Academic";
import { ChevronDown } from "lucide-react";

export function TrackingGroup({ title, count, expanded, onToggle, glyph = "people", children }: {
    glyph?: AcademicGlyph; title: string; count: number; expanded: boolean; onToggle(): void; children: ReactNode;
}) {
    const id = useId();
    return <section className="tracking-group min-w-0 rounded-xl border border-outline bg-surface/40">
        <h2><button type="button" aria-expanded={expanded} aria-controls={id} onClick={onToggle}
            className="flex min-h-14 w-full items-center gap-3 rounded-control px-4 py-3 text-left font-semibold text-content hover:bg-surface-hover">
            <PixelGlyph name={glyph} size={24}/><span className="min-w-0">{title}</span><span className="tracking-count rounded-full px-2 py-1 text-xs">{count}</span><ChevronDown className="ml-auto shrink-0" size={22} aria-hidden="true" style={{ transform: expanded ? undefined : 'rotate(-90deg)' }}/>
        </button></h2>
        <div id={id} hidden={!expanded} className="tracking-group-body px-3 pb-3 sm:px-4 sm:pb-4">{children}</div>
    </section>;
}
