export type ConfirmVariant =
    | "danger"
    | "default";

export interface ConfirmOptions {
    title: string;
    message: string;

    confirmLabel?: string;
    cancelLabel?: string;

    variant?: ConfirmVariant;
}

export interface ConfirmRequest
    extends ConfirmOptions {

    resolve: (
        confirmed: boolean
    ) => void;
}