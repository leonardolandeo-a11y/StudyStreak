interface EmptyStateProps {
    message: string;
}

function EmptyState({
    message
}: EmptyStateProps) {
    return (
        <div
            className="
                rounded-xl
                border border-dashed border-slate-700
                bg-slate-900/40
                px-6 py-10
                text-center
                text-sm text-slate-400
            "
        >
            {message}
        </div>
    );
}

export default EmptyState;