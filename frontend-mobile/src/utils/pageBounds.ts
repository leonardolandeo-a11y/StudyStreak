// Return a valid page only when the requested page no longer exists.
export function getPageFallback(page: number, totalPages: number): number | null {
  if (page <= 0 || page < totalPages) return null;
  return Math.max(0, totalPages - 1);
}
