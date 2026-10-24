import {
    createContext
} from "react";

import type {
    ConfirmOptions
} from "../types/confirm";

export interface ConfirmContextValue {
    confirm: (
        options: ConfirmOptions
    ) => Promise<boolean>;
}

export const ConfirmContext =
    createContext<ConfirmContextValue | null>(
        null
    );