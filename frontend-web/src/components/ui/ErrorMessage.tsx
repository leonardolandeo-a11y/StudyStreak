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
                rounded-xl
                border border-red-900/60
                bg-red-950/40
                px-4 py-3
                text-sm text-red-300
            "
        >
            {message}
        </div>
    );
}

export default ErrorMessage;