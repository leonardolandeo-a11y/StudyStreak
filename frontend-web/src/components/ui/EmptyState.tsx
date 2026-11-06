interface EmptyStateProps {
    message: string;
}

function EmptyState({
    message
}: EmptyStateProps) {
    return (
        <div
            className="
                rounded-control
                border border-dashed border-outline-strong
                bg-surface
                px-6 py-10
                text-center
                text-sm text-content-muted
                break-words
            "
        >
            {message}
        </div>
    );
}

export default EmptyState;
