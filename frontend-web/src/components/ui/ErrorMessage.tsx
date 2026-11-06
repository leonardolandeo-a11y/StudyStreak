interface ErrorMessageProps {
    message: string;
}

function ErrorMessage({
    message
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
        </div>
    );
}

export default ErrorMessage;
