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
        <div className="mt-6 flex items-center gap-4">

            <button
                type="button"
                onClick={onPrevious}
                disabled={first}
                className="border p-2 disabled:opacity-50"
            >
                Previous
            </button>

            <span>
                Page {page + 1}

                {totalPages > 0 && ` of ${totalPages}`}
            </span>

            <button
                type="button"
                onClick={onNext}
                disabled={last}
                className="border p-2 disabled:opacity-50"
            >
                Next
            </button>

        </div>
    );
}
export default PaginationControls;