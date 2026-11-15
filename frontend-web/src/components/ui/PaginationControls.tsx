interface PaginationControlsProps {
  page: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onPageChange?: (page: number) => void;
  size?: number;
  totalElements?: number;
  onPageSizeChange?: (size: number) => void;
  label?: string;
}

function PaginationControls({ page, totalPages, first, last, onPrevious, onNext, onPageChange, size, totalElements, onPageSizeChange, label = "Pagination" }: PaginationControlsProps) {
  const startPage = Math.max(0, Math.min(page - 2, totalPages - 5));
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, index) => startPage + index);
  const start = size !== undefined && totalElements !== undefined ? (totalElements === 0 ? 0 : Math.min(page * size + 1, totalElements)) : null;
  const end = size !== undefined && totalElements !== undefined ? Math.min((page + 1) * size, totalElements) : null;

  return (
    <nav aria-label={label} className="mt-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onPrevious} disabled={first} className="study-button">Previous</button>
        {onPageChange && pages.map((number) => (
          <button key={number} type="button" onClick={() => onPageChange(number)} aria-label={`Page ${number + 1}`} aria-current={page === number ? "page" : undefined} disabled={page === number} className="study-button min-w-11">{number + 1}</button>
        ))}
        <button type="button" onClick={onNext} disabled={last} className="study-button">Next</button>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm text-content-muted">
        {start !== null && end !== null && totalElements !== undefined && <span aria-live="polite">Showing {start}–{end} of {totalElements}</span>}
        <span>Page {page + 1} of {Math.max(totalPages, 1)}</span>
        {onPageSizeChange && size !== undefined && (
          <label className="flex items-center gap-2">
            <span>Per page</span>
            <select value={size} onChange={(event) => onPageSizeChange(Number(event.target.value))} className="min-h-11 rounded-control border border-outline-strong bg-surface px-2 py-2 text-content">
              {[10, 20, 25, 50, 100].map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        )}
      </div>
    </nav>
  );
}

export default PaginationControls;
