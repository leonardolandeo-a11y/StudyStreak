interface ErrorMessageProps {
    message: string;
    onRetry?: () => void;
}

function ErrorMessage({
    message, onRetry
}: ErrorMessageProps) {
    return (
        <div
            role="alert"
            className="
                rounded-control
                border border-danger-outline
                bg-danger-surface
                px-4 py-3
                text-sm text-danger
                break-words
            "
        >
            {message}
            {onRetry && <button type="button" onClick={onRetry} className="study-button ml-3 mt-2">Retry</button>}
        </div>
    );
}

export default ErrorMessage;
