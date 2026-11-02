export function fallbackPage(page: number, totalPages: number): number | null {
    return page > 0 && page >= totalPages ? Math.max(0, totalPages - 1) : null;
}

export function recoverPageParams(
    params: URLSearchParams,
    pages: ReadonlyArray<{ key: string; current: number; totalPages: number }>
): URLSearchParams | null {
    const next = new URLSearchParams(params);
    let changed = false;
    for (const { key, current, totalPages } of pages) {
        const fallback = fallbackPage(current, totalPages);
        if (fallback === null) continue;
        if (fallback === 0) next.delete(key);
        else next.set(key, String(fallback));
        changed = true;
    }
    return changed ? next : null;
}
