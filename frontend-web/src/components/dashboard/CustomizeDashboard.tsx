import { useEffect, useState } from 'react';
import { GripVertical } from 'lucide-react';
import { defaultWidgets, widgetLabels, type WidgetSetting } from '../../features/dashboard/widgetPreferences';
import { useWidgetReorder } from '../../hooks/useWidgetReorder';
import { WorkflowDialog } from '../workflows/WorkflowDialog';
import '../workflows/workflows.css';

export function CustomizeDashboard({ rows, ready, error, save }: { rows: WidgetSetting[]; ready: boolean; error: string | null; save(rows: WidgetSetting[]): Promise<void> }) {
    const [open, setOpen] = useState(false);
    const reorder = useWidgetReorder(rows,save);
    useEffect(() => {
        if (!open) return;
        const root = document.documentElement, previous = root.style.overflow, gutter = root.style.scrollbarGutter;
        root.style.scrollbarGutter = 'stable';
        root.style.overflow = 'hidden';
        return () => { root.style.overflow = previous; root.style.scrollbarGutter = gutter; };
    }, [open]);
    const close = () => { reorder.cancel(); setOpen(false); };
    return <>
        <div className="flex flex-wrap items-center justify-end gap-3">
            {error && <span role="alert" className="text-sm text-danger">{error} <button className="study-button" onClick={() => void save(rows)}>Retry layout</button></span>}
            <button className="study-button" type="button" aria-haspopup="dialog" disabled={!ready} onClick={() => setOpen(true)}>Customize Dashboard</button>
        </div>
        {open && <WorkflowDialog title="Customize Dashboard" onClose={close}>
            <div className="widget-customize" onKeyDown={event => { if (event.key === 'Escape') reorder.cancel(); }}>
                <p id="widget-reorder-help" className="text-sm text-content-secondary">Drag a handle to reorder. With the handle focused, use ↑ / ↓ or Home / End. Changes save automatically for your account.</p>
                {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
                <ol className="widget-controls">{rows.map(row => <li key={row.id} data-reorder-item={row.id} {...reorder.targetProps(row.id)}>
                    <button type="button" className="study-button widget-drag-handle" aria-describedby="widget-reorder-help" {...reorder.handleProps(row.id)}><GripVertical size={18} aria-hidden="true"/></button>
                    <label className="flex min-h-11 min-w-0 flex-1 items-center gap-3"><input aria-label={`Show ${widgetLabels[row.id]}`} type="checkbox" checked={row.visible} onChange={() => { void save(rows.map(item => item.id === row.id ? { ...item, visible: !item.visible } : item)); reorder.announce(`${widgetLabels[row.id]} ${row.visible ? 'hidden' : 'shown'}.`); }}/><span>{widgetLabels[row.id]}</span></label>
                </li>)}</ol>
                <p role="status" aria-live="polite" className="widget-reorder-status">{reorder.announcement}</p>
                <div className="flex flex-wrap items-center justify-between gap-2"><button type="button" className="study-button" onClick={() => { void save(defaultWidgets()); reorder.announce('Default layout restored.'); }}>Restore default layout</button><button type="button" className="study-button" onClick={close}>Done customizing</button></div>
            </div>
        </WorkflowDialog>}
    </>;
}
