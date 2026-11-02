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
}

function PaginationControls({ page, totalPages, first, last, onPrevious, onNext, onPageChange, size, totalElements, onPageSizeChange }: PaginationControlsProps) {
  const startPage = Math.max(0, Math.min(page - 2, totalPages - 5));
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, index) => startPage + index);
  const start = size !== undefined && totalElements !== undefined ? Math.min(page * size + 1, totalElements) : null;
  const end = size !== undefined && totalElements !== undefined ? Math.min((page + 1) * size, totalElements) : null;

  return (
    <nav aria-label="Pagination" className="mt-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onPrevious} disabled={first} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
        {onPageChange && pages.map((number) => (
          <button key={number} type="button" onClick={() => onPageChange(number)} aria-label={`Page ${number + 1}`} aria-current={page === number ? "page" : undefined} className={`min-w-9 rounded-lg border px-3 py-2 text-sm ${page === number ? "border-sky-400 bg-sky-500/20 font-semibold text-sky-200" : "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"}`}>{number + 1}</button>
        ))}
        <button type="button" onClick={onNext} disabled={last} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
        {start !== null && end !== null && totalElements !== undefined && <span>Showing {start}–{end} of {totalElements}</span>}
        <span>Page {page + 1} of {Math.max(totalPages, 1)}</span>
        {onPageSizeChange && size !== undefined && (
          <label className="flex items-center gap-2">
            <span>Per page</span>
            <select value={size} onChange={(event) => onPageSizeChange(Number(event.target.value))} className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-slate-200 focus-visible:outline-2 focus-visible:outline-sky-400">
              {[10, 25, 50, 100].map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        )}
      </div>
    </nav>
  );
}

export default PaginationControls;
