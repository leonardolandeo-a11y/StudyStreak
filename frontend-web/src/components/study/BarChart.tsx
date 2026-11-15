import { useState } from 'react';
import { barPercent } from './chartPresentation';
export interface Bar { label: string; value: number; }
export function BarChart({ items, unit = 'min', label }: { items: Bar[]; unit?: string; label: string }) {
    const [selected, setSelected] = useState<number | null>(null);
    const active = selected === null ? undefined : items[selected];
    const maximum = Math.max(0, ...items.map(item => item.value));
    const nonZero = items.filter(item => item.value > 0);
    const compressed = items.length > 4 && nonZero.length <= 4;
    const horizontal = items.length <= 4 || compressed;
    const visible = compressed ? nonZero : items;
    const valueLabel = (item: Bar) => `${item.label}: ${item.value.toFixed(1)} ${unit}`;
    return <figure className="min-w-0" aria-label={label}>
        <figcaption className="mb-3 flex flex-wrap justify-between gap-2 text-sm"><span className="font-semibold text-content">{label}</span><span className="text-content-muted">Peak {maximum.toFixed(1)} {unit}</span></figcaption>
        {!items.length ? <p className="text-sm text-content-muted">No recorded time in this period.</p>
        : horizontal ? <div className="space-y-2" data-chart-layout="rows">
            {!visible.length && <p className="text-sm text-content-muted">All {items.length} recorded values are zero.</p>}
            {visible.map((item,index) => <button key={index} type="button" aria-label={valueLabel(item)} aria-pressed={active === item}
                onFocus={() => setSelected(items.indexOf(item))} onClick={() => setSelected(items.indexOf(item))}
                className="grid min-h-11 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 rounded-control px-1 py-2 text-left">
                <span className="break-words text-xs text-content-secondary">{item.label}</span><span className="text-xs tabular-nums text-content">{item.value.toFixed(1)} {unit}</span>
                <span className="col-span-2 mt-1 h-2 rounded-full bg-canvas"><span className="block h-2 rounded-full bg-accent" style={{width:`${barPercent(item.value,maximum)}%`}}/></span>
            </button>)}
            {compressed && <p className="text-xs text-content-muted">Non-zero values shown. Zero values remain available below.</p>}
        </div> : <div className="overflow-x-auto pb-2">
            <div data-chart-layout="columns" className="flex h-36 min-w-full items-end gap-1 border-b border-outline" style={{ minWidth: items.length * 40 }}>
                {items.map((item,index) => <button key={index} type="button" aria-label={valueLabel(item)} aria-pressed={active === item}
                    onFocus={() => setSelected(items.indexOf(item))} onClick={() => setSelected(items.indexOf(item))} className="group flex h-full min-w-9 flex-1 flex-col justify-end gap-2 rounded-t-md px-1">
                    <span className="flex h-28 items-end"><span className="w-full rounded-t-md bg-accent/75 group-hover:bg-accent" style={{height:`${barPercent(item.value,maximum)}%`}}/></span>
                    <span className="pb-1 text-xs text-content-muted">{item.label.length > 7 ? item.label.slice(5) : item.label}</span>
                </button>)}
            </div>
        </div>}
        {items.length > 4 && <details className="mt-2"><summary className="min-h-11 cursor-pointer py-3 text-xs font-semibold text-accent">All {items.length} recorded values</summary><ol className="grid gap-1 sm:grid-cols-2">{items.map((item,index) => <li key={index}><button type="button" className="min-h-11 w-full rounded-control px-2 text-left text-xs text-content-secondary" onClick={() => setSelected(items.indexOf(item))} aria-label={valueLabel(item)}>{valueLabel(item)}</button></li>)}</ol></details>}
        {active && <p aria-live="polite" className="mt-2 text-xs text-accent">{active.label} · {active.value.toFixed(1)} {unit}</p>}
    </figure>;
}
