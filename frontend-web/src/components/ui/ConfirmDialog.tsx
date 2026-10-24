import {
    AlertTriangle,
    X
} from "lucide-react";

import {
    useEffect
} from "react";

import type {
    ConfirmOptions
} from "../../types/confirm";

interface ConfirmDialogProps
    extends ConfirmOptions {

    open: boolean;

    onConfirm: () => void;

    onCancel: () => void;
}

function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = "default",
    onConfirm,
    onCancel
}: ConfirmDialogProps) {

    useEffect(() => {

        if (!open) {
            return;
        }

        function handleKeyDown(
            event: KeyboardEvent
        ) {
            if (event.key === "Escape") {
                onCancel();
            }
        }

        window.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };

    }, [
        open,
        onCancel
    ]);


    if (!open) {
        return null;
    }


    const isDanger =
        variant === "danger";


    return (
        <div
            className="
                fixed inset-0
                z-120
                flex items-center
                justify-center
                bg-black/60
                px-4
                backdrop-blur-sm
            "
            onMouseDown={onCancel}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-dialog-title"
                aria-describedby="confirm-dialog-description"
                onMouseDown={(event) =>
                    event.stopPropagation()
                }
                className="
                    w-full
                    max-w-md
                    rounded-2xl
                    border border-slate-800
                    bg-slate-900
                    shadow-2xl shadow-black/50
                "
            >

                <div
                    className="
                        flex items-start
                        justify-between
                        gap-4
                        border-b border-slate-800
                        px-5 py-4
                    "
                >
                    <div
                        className="
                            flex items-start gap-3
                        "
                    >
                        <div
                            className={`
                                flex h-10 w-10
                                shrink-0
                                items-center
                                justify-center
                                rounded-xl
                                ${
                                    isDanger
                                        ? "bg-red-950 text-red-400"
                                        : "bg-sky-950 text-sky-400"
                                }
                            `}
                        >
                            <AlertTriangle
                                size={20}
                                strokeWidth={1.8}
                            />
                        </div>

                        <div>
                            <h2
                                id="confirm-dialog-title"
                                className="
                                    text-lg
                                    font-semibold
                                    text-slate-100
                                "
                            >
                                {title}
                            </h2>

                            <p
                                id="confirm-dialog-description"
                                className="
                                    mt-1
                                    text-sm
                                    leading-6
                                    text-slate-400
                                "
                            >
                                {message}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onCancel}
                        aria-label="Close confirmation dialog"
                        className="
                            rounded-lg
                            p-2
                            text-slate-500
                            hover:bg-slate-800
                            hover:text-slate-200
                        "
                    >
                        <X size={18} />
                    </button>
                </div>


                <div
                    className="
                        flex
                        justify-end
                        gap-3
                        px-5 py-4
                    "
                >
                    <button
                        type="button"
                        onClick={onCancel}
                        className="
                            rounded-lg
                            border border-slate-700
                            bg-slate-950
                            px-4 py-2
                            text-sm font-medium
                            text-slate-300
                            hover:bg-slate-800
                        "
                    >
                        {cancelLabel}
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        autoFocus
                        className={`
                            rounded-lg
                            px-4 py-2
                            text-sm font-semibold
                            ${
                                isDanger
                                    ? "bg-red-500 text-white hover:bg-red-400"
                                    : "bg-sky-500 text-slate-950 hover:bg-sky-400"
                            }
                        `}
                    >
                        {confirmLabel}
                    </button>
                </div>

            </div>
        </div>
    );
}

export default ConfirmDialog;