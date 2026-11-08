/** Bound independent protected image/profile requests without another dependency. */
export function createRequestQueue(limit: number) {
    let active = 0;
    const waiting: (() => void)[] = [];
    function drain() {
        while (active < limit && waiting.length) waiting.shift()?.();
    }
    return function enqueue<T>(request: () => Promise<T>, signal: AbortSignal): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            waiting.push(() => {
                if (signal.aborted) { reject(new DOMException("Request aborted", "AbortError")); return; }
                active++;
                void Promise.resolve().then(request).then(resolve, reject).finally(() => { active--; drain(); });
            });
            drain();
        });
    };
}
