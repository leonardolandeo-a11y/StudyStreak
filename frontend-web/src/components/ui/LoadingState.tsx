interface LoadingStateProps {
    message?: string;
}

function LoadingState({
    message = "Loading..."
}: LoadingStateProps) {
    return (
        <div
            role="status"
            className="study-status"
        >
            <div
                aria-hidden="true"
                className="
                    h-4 w-4
                    animate-spin
                    rounded-full
                    shrink-0
                    border-2 border-outline-strong
                    border-t-accent
                "
            />

            <span className="min-w-0 break-words">{message}</span>
        </div>
    );
}

export default LoadingState;
