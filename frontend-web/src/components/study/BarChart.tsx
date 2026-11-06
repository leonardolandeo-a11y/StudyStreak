import { useState } from 'react';
import { barPercent } from './chartPresentation';
export interface Bar { label: string; value: number; }
export function BarChart({ items, unit = 'min', label }: { items: Bar[]; unit?: string; label: string }) {
  const [selected, setSelected] = useState<number | null>(null);
  const maximum = Math.max(0, ...items.map(item => item.value));
  const active = selected === null ? null : items[selected];
  return <figure className="min-w-0" aria-label={label}>
    <figcaption className="mb-4 flex flex-wrap justify-between gap-2 text-sm"><span className="font-semibold text-white">{label}</span><span className="text-slate-400">Peak {maximum.toFixed(1)} {unit}</span></figcaption>
    {items.length === 0 ? <p className="study-empty">No recorded time in this period.</p> : <div className="overflow-x-auto pb-2">
      <div className="flex h-48 min-w-full items-end gap-2 border-b border-slate-700" style={{ minWidth: items.length * 38 }}>
        {items.map((item, index) => <button key={`${item.label}-${index}`} type="button" aria-label={`${item.label}: ${item.value.toFixed(1)} ${unit}`} aria-pressed={selected === index}
          onFocus={() => setSelected(index)} onClick={() => setSelected(index)} className="group flex h-full min-w-8 flex-1 flex-col justify-end gap-2 rounded-t-md px-1">
          <span className="flex h-36 items-end"><span className={`w-full rounded-t-md ${selected === index ? 'bg-emerald-200' : 'bg-emerald-400/70 group-hover:bg-emerald-300'}`} style={{ height: `${barPercent(item.value, maximum)}%` }} /></span>
          <span className="pb-2 text-xs text-slate-400">{item.label.length > 7 ? item.label.slice(5) : item.label}</span>
        </button>)}
      </div>
    </div>}
    <p aria-live="polite" className="mt-3 min-h-6 text-sm text-emerald-200">{active ? `${active.label} · ${active.value.toFixed(1)} ${unit}` : 'Select a bar to inspect its recorded value.'}</p>
    {maximum === 0 && items.length > 0 && <p className="text-sm text-slate-400">No confirmed time yet. Zero values are shown without a bar.</p>}
  </figure>;
}
