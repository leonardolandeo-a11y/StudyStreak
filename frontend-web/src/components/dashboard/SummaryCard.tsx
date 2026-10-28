import { useEffect, useState, type ReactNode } from "react";
import { AlertCircle, ArrowRight, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";

type MetricState<T> =
    | { status: "loading" }
    | { status: "error" }
    | { status: "success"; value: T };

interface SummaryCardProps<T> {
    title: string;
    icon: ReactNode;
    accent: string;
    href: string;
    action: string;
    load: (signal: AbortSignal) => Promise<T>;
    children: (value: T) => ReactNode;
}

function SummaryCard<T>({
    title,
    icon,
    accent,
    href,
    action,
    load,
    children
}: SummaryCardProps<T>) {
    const [attempt, setAttempt] = useState(0);
    const [metric, setMetric] = useState<MetricState<T>>({ status: "loading" });

    useEffect(() => {
        const controller = new AbortController();
        load(controller.signal)
            .then(value => {
                if (!controller.signal.aborted) {
                    setMetric({ status: "success", value });
                }
            })
            .catch(() => {
                if (!controller.signal.aborted) {
                    setMetric({ status: "error" });
                }
            });
        return () => controller.abort();
    }, [load, attempt]);

    function retry() {
        setMetric({ status: "loading" });
        setAttempt(value => value + 1);
    }

    return (
        <article className="flex min-h-56 flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>
                {icon}
            </div>
            <h2 className="mt-4 text-sm font-semibold text-slate-300">{title}</h2>
            <div className="mt-3 flex-1" aria-live="polite">
                {metric.status === "loading" && (
                    <div className="space-y-3" role="status" aria-label={`Loading ${title}`}>
                        <div className="h-8 w-24 animate-pulse rounded-lg bg-slate-800" />
                        <div className="h-4 w-36 animate-pulse rounded bg-slate-800" />
                    </div>
                )}
                {metric.status === "error" && (
                    <div className="text-sm text-red-300" role="alert">
                        <div className="flex items-center gap-2"><AlertCircle size={16} />Could not load {title.toLowerCase()}.</div>
                        <button type="button" onClick={retry} className="mt-3 inline-flex items-center gap-2 rounded-md px-2 py-1 text-sky-300 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400">
                            <RotateCcw size={14} /> Retry
                        </button>
                    </div>
                )}
                {metric.status === "success" && children(metric.value)}
            </div>
            <Link to={href} className="mt-5 inline-flex items-center gap-2 self-start text-sm font-medium text-sky-400 hover:text-sky-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400">
                {action}<ArrowRight size={15} />
            </Link>
        </article>
    );
}

export default SummaryCard;
