interface PaginationControlsProps {
    page: number;
    totalPages: number;
    first: boolean;
    last: boolean;
    onPrevious: () => void;
    onNext: () => void;
}


function PaginationControls({
    page,
    totalPages,
    first,
    last,
    onPrevious,
    onNext
}: PaginationControlsProps) {

    return (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">

            <button
                type="button"
                onClick={onPrevious}
                disabled={first}
                className="
                    rounded-lg
                    border border-slate-700
                    bg-slate-900
                    px-4 py-2
                    text-sm font-medium
                    text-slate-200
                    hover:border-slate-600
                    hover:bg-slate-800
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                "
            >
                Previous
            </button>

            <span className="text-sm text-slate-400">
                Page{" "}
                <span className="font-semibold text-slate-200">
                    {page + 1}
                </span>
                {" "}of{" "}
                <span className="font-semibold text-slate-200">
                    {Math.max(totalPages, 1)}
                </span>
            </span>

            <button
                type="button"
                onClick={onNext}
                disabled={last}
                className="
                    rounded-lg
                    border border-slate-700
                    bg-slate-900
                    px-4 py-2
                    text-sm font-medium
                    text-slate-200
                    hover:border-slate-600
                    hover:bg-slate-800
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                "
            >
                Next
            </button>

        </div>
    );
}
export default PaginationControls;