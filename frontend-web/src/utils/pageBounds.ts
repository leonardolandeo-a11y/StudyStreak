export function fallbackPage(page: number, totalPages: number): number | null {
    return page > 0 && page >= totalPages ? Math.max(0, totalPages - 1) : null;
}
