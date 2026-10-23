import {
    CheckCircle2,
    CircleAlert,
    Info,
    X
} from "lucide-react";

import {
    useCallback,
    useMemo,
    useState,
    type ReactNode
} from "react";

import {
    ToastContext
} from "../../contexts/ToastContext";

import type {
    Toast,
    ToastType
} from "../../types/toast";


interface ToastProviderProps {
    children: ReactNode;
}


const TOAST_DURATION = 4000;


function ToastProvider({
    children
}: ToastProviderProps) {

    const [toasts, setToasts] =
        useState<Toast[]>([]);


    const dismissToast = useCallback(
        (toastId: string) => {

            setToasts(
                (currentToasts) =>
                    currentToasts.filter(
                        (toast) =>
                            toast.id !== toastId
                    )
            );

        },
        []
    );


    const showToast = useCallback(
        (
            message: string,
            type: ToastType = "info"
        ) => {

            const toastId =
                crypto.randomUUID();


            const newToast: Toast = {
                id: toastId,
                message,
                type
            };


            setToasts(
                (currentToasts) => [
                    ...currentToasts,
                    newToast
                ]
            );


            window.setTimeout(
                () => {
                    dismissToast(toastId);
                },
                TOAST_DURATION
            );

        },
        [dismissToast]
    );


    const contextValue = useMemo(
        () => ({
            showToast,
            dismissToast
        }),
        [
            showToast,
            dismissToast
        ]
    );


    return (
        <ToastContext.Provider
            value={contextValue}
        >
            {children}


            <div
                className="
                    pointer-events-none
                    fixed
                    right-4 top-4
                    z-[100]
                    flex w-[calc(100%-2rem)]
                    max-w-sm
                    flex-col
                    gap-3
                    sm:right-6
                    sm:top-6
                "
            >
                {toasts.map((toast) => {

                    const isSuccess =
                        toast.type === "success";

                    const isError =
                        toast.type === "error";


                    const Icon =
                        isSuccess
                            ? CheckCircle2
                            : isError
                            ? CircleAlert
                            : Info;


                    return (
                        <div
                            key={toast.id}
                            role={
                                isError
                                    ? "alert"
                                    : "status"
                            }
                            className={`
                                pointer-events-auto
                                flex items-start gap-3
                                rounded-xl
                                border
                                px-4 py-3
                                shadow-xl shadow-black/30
                                backdrop-blur
                                ${
                                    isSuccess
                                        ? "border-emerald-900/60 bg-emerald-950/95 text-emerald-200"
                                        : isError
                                        ? "border-red-900/60 bg-red-950/95 text-red-200"
                                        : "border-sky-900/60 bg-sky-950/95 text-sky-200"
                                }
                            `}
                        >
                            <Icon
                                size={18}
                                className="mt-0.5 shrink-0"
                            />


                            <p
                                className="
                                    min-w-0 flex-1
                                    text-sm leading-5
                                "
                            >
                                {toast.message}
                            </p>


                            <button
                                type="button"
                                onClick={() =>
                                    dismissToast(
                                        toast.id
                                    )
                                }
                                aria-label="Dismiss notification"
                                className="
                                    shrink-0
                                    rounded-md
                                    p-1
                                    opacity-70
                                    hover:bg-black/20
                                    hover:opacity-100
                                "
                            >
                                <X size={16} />
                            </button>
                        </div>
                    );
                })}
            </div>

        </ToastContext.Provider>
    );
}


export default ToastProvider;