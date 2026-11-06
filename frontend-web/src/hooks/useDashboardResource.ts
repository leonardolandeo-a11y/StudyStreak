import { useEffect, useState } from "react";

export type DashboardResource<T> = { status: "loading" } | { status: "error" } | { status: "success"; data: T };

/** Associate each snapshot with its loader, so switching periods never shows stale data. */
export function useDashboardResource<T>(load: (signal: AbortSignal) => Promise<T>) {
    const [result, setResult] = useState<{ load: typeof load; state: DashboardResource<T> } | null>(null);
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        void load(controller.signal).then(data => {
            if (!controller.signal.aborted) setResult({ load, state: { status: "success", data } });
        }).catch(() => {
            if (!controller.signal.aborted) setResult({ load, state: { status: "error" } });
        });
        return () => controller.abort();
    }, [load, attempt]);
    const state: DashboardResource<T> = result?.load === load ? result.state : { status: "loading" };
    return { state, retry: () => { setResult(null); setAttempt(n => n + 1); } };
}
