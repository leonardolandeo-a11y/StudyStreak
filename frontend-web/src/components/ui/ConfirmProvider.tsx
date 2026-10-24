import {
    useCallback,
    useMemo,
    useState,
    type ReactNode
} from "react";

import {
    ConfirmContext
} from "../../contexts/ConfirmContext";

import ConfirmDialog
    from "./ConfirmDialog";

import type {
    ConfirmOptions,
    ConfirmRequest
} from "../../types/confirm";


interface ConfirmProviderProps {
    children: ReactNode;
}


function ConfirmProvider({
    children
}: ConfirmProviderProps) {

    const [
        request,
        setRequest
    ] = useState<ConfirmRequest | null>(
        null
    );


    const confirm = useCallback(
        (
            options: ConfirmOptions
        ): Promise<boolean> => {

            return new Promise<boolean>(
                (resolve) => {

                    setRequest({
                        ...options,
                        resolve
                    });

                }
            );
        },
        []
    );


    const handleConfirm = useCallback(
        () => {

            if (!request) {
                return;
            }

            request.resolve(true);

            setRequest(null);

        },
        [request]
    );


    const handleCancel = useCallback(
        () => {

            if (!request) {
                return;
            }

            request.resolve(false);

            setRequest(null);

        },
        [request]
    );


    const contextValue = useMemo(
        () => ({
            confirm
        }),
        [confirm]
    );


    return (
        <ConfirmContext.Provider
            value={contextValue}
        >
            {children}

            <ConfirmDialog
                open={request !== null}
                title={request?.title ?? ""}
                message={request?.message ?? ""}
                confirmLabel={
                    request?.confirmLabel
                }
                cancelLabel={
                    request?.cancelLabel
                }
                variant={
                    request?.variant
                }
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />

        </ConfirmContext.Provider>
    );
}


export default ConfirmProvider;