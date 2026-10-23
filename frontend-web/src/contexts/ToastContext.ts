import {
    createContext
} from "react";

import type {
    ToastType
} from "../types/toast";


export interface ToastContextValue {
    showToast: (
        message: string,
        type?: ToastType
    ) => void;

    dismissToast: (
        toastId: string
    ) => void;
}


export const ToastContext =createContext<ToastContextValue | null>(
        null
    );