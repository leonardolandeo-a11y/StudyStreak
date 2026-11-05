export function MetricCard({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return <div className="min-w-0 rounded-xl border border-slate-800 bg-slate-950 p-4">
    <p className="text-sm text-slate-400">{label}</p>
    <p className="mt-2 break-words text-3xl font-semibold tracking-tight text-white tabular-nums">{value}</p>
    <p className="mt-2 text-xs leading-relaxed text-slate-400">{detail}</p>
  </div>;
}
