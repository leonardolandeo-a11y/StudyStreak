import { useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { defaultWidgets, moveWidget, widgetLabels, type WidgetSetting } from '../../features/dashboard/widgetPreferences';
/** Inline panel keeps the real Dashboard visible as a live preview; no duplicate fetches. */
export function CustomizeDashboard({ rows, ready, error, save }: { rows: WidgetSetting[]; ready: boolean; error: string | null; save(rows: WidgetSetting[]): Promise<void> }) {
    const [open, setOpen] = useState(false);
    const [announcement, setAnnouncement] = useState('');
    return <>
        <div className="flex flex-wrap items-center justify-end gap-3">
            {error && <span role="alert" className="text-sm text-danger">{error} <button className="study-button" onClick={() => void save(rows)}>Retry layout</button></span>}
            <button className="study-button" type="button" aria-expanded={open} aria-controls="dashboard-customize" disabled={!ready} onClick={() => setOpen(value => !value)}>Customize Dashboard</button>
        </div>
        {open && <section id="dashboard-customize" aria-label="Customize Dashboard" className="study-panel widget-customize p-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-bold">Customize Dashboard</h2><button type="button" className="study-button" onClick={() => { void save(defaultWidgets()); setAnnouncement('Default layout restored.'); }}>Restore default layout</button></div>
            <p className="my-3 text-sm text-content-secondary">Changes preview below and save on this device for your account.</p>
            <ol className="widget-controls">{rows.map((row,index) => <li key={row.id} className="flex min-w-0 items-center gap-2 py-2">
                <label className="flex min-h-11 min-w-0 flex-1 items-center gap-3"><input aria-label={`Show ${widgetLabels[row.id]}`} type="checkbox" checked={row.visible} onChange={() => { void save(rows.map(item => item.id === row.id ? { ...item, visible: !item.visible } : item)); setAnnouncement(`${widgetLabels[row.id]} ${row.visible ? 'hidden' : 'shown'}.`); }}/><span>{widgetLabels[row.id]}</span></label>
                {([-1,1] as const).map(direction => <button key={direction} type="button" className="study-button size-11 shrink-0 p-0" disabled={direction < 0 ? index === 0 : index === rows.length-1} aria-label={`Move ${widgetLabels[row.id]} ${direction < 0 ? 'up' : 'down'}`} onClick={() => { void save(moveWidget(rows,row.id,direction)); setAnnouncement(`${widgetLabels[row.id]} moved ${direction < 0 ? 'up' : 'down'}.`); }}>{direction < 0 ? <ArrowUp size={16}/> : <ArrowDown size={16}/>}</button>)}
            </li>)}</ol>
            <p role="status" aria-live="polite" className="text-sm text-content-muted">{announcement}</p>
            <button type="button" className="study-button mt-3" onClick={() => setOpen(false)}>Done customizing</button>
        </section>}
    </>;
}
