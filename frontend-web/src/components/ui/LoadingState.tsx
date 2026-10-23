interface LoadingStateProps {
    message?: string;
}

function LoadingState({
    message = "Loading..."
}: LoadingStateProps) {
    return (
        <div
            className="
                flex items-center gap-3
                rounded-xl
                border border-slate-800
                bg-slate-900/60
                px-4 py-3
                text-sm text-slate-400
            "
        >
            <div
                className="
                    h-4 w-4
                    animate-spin
                    rounded-full
                    border-2 border-slate-700
                    border-t-sky-400
                "
            />

            <span>{message}</span>
        </div>
    );
}

export default LoadingState;