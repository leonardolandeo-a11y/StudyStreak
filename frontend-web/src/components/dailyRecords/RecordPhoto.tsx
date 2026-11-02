import {
    useEffect,
    useState
} from "react";

import {
    deleteRecordPhoto,
    downloadRecordPhoto,
    uploadRecordPhoto
} from "../../services/photoEvidenceService";

import {
    getApiErrorMessage
} from "../../utils/apiError";

import {
    useToast
} from "../../hooks/useToast";

import {
    useConfirm
} from "../../hooks/useConfirm";

interface RecordPhotoProps {
    goalId:number;
    recordId:number;
    available:boolean;
    readOnly?:boolean;
    onChanged?:() => void;
}

const MAX_PHOTO_SIZE =
    2 * 1024 * 1024;

function RecordPhoto({
    goalId,
    recordId,
    available,
    readOnly = false,
    onChanged
}:RecordPhotoProps) {
    const { showToast } = useToast();
    const confirm = useConfirm();

    const [previewUrl, setPreviewUrl] =
        useState<string | null>(null);

    const [loading, setLoading] =
        useState(false);

    const [busy, setBusy] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const [reloadKey, setReloadKey] =
        useState(0);

    useEffect(() => {
        if (!available) {
            return;
        }

        const controller =
            new AbortController();

        let objectUrl:string | null =
            null;

        async function loadPhoto() {
            try {
                setLoading(true);
                setError(null);

                const blob =
                    await downloadRecordPhoto(
                        goalId,
                        recordId,
                        controller.signal
                    );

                if (
                    controller.signal.aborted
                ) {
                    return;
                }

                objectUrl =
                    URL.createObjectURL(blob);

                setPreviewUrl(objectUrl);

            } catch (cause) {
                if (
                    !controller.signal.aborted
                ) {
                    setError(
                        getApiErrorMessage(
                            cause,
                            "Unable to load the saved photo."
                        )
                    );
                }
            } finally {
                if (
                    !controller.signal.aborted
                ) {
                    setLoading(false);
                }
            }
        }

        void loadPhoto();

        return () => {
            controller.abort();

            if (objectUrl) {
                URL.revokeObjectURL(
                    objectUrl
                );
            }
        };

    }, [
        available,
        goalId,
        recordId,
        reloadKey
    ]);

    async function upload(
        file:File
    ) {
        if (
            file.type !== "image/jpeg"
        ) {
            setError(
                "Photo evidence must be a JPEG image."
            );
            return;
        }

        if (
            file.size <= 0 ||
            file.size > MAX_PHOTO_SIZE
        ) {
            setError(
                "Photo evidence must be 2 MB or smaller."
            );
            return;
        }

        try {
            setBusy(true);
            setError(null);

            await uploadRecordPhoto(
                goalId,
                recordId,
                file
            );

            showToast(
                available
                    ? "Photo evidence replaced."
                    : "Photo evidence added.",
                "success"
            );

            setReloadKey(
                value => value + 1
            );

            onChanged?.();

        } catch (cause) {
            setError(
                getApiErrorMessage(
                    cause,
                    "Could not save photo evidence."
                )
            );
        } finally {
            setBusy(false);
        }
    }

    async function remove() {
        const confirmed =
            await confirm({
                title:"Delete photo evidence?",
                message:
                    "This photo will be permanently removed from the daily record.",
                confirmLabel:"Delete photo",
                cancelLabel:"Cancel",
                variant:"danger"
            });

        if (!confirmed) {
            return;
        }

        try {
            setBusy(true);
            setError(null);

            await deleteRecordPhoto(
                goalId,
                recordId
            );

            showToast(
                "Photo evidence deleted.",
                "success"
            );

            onChanged?.();

        } catch (cause) {
            setError(
                getApiErrorMessage(
                    cause,
                    "Could not delete photo evidence."
                )
            );
        } finally {
            setBusy(false);
        }
    }

    return (
        <div
            className="
                rounded-xl
                border border-slate-800
                bg-slate-950/50
                p-4
            "
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                        Photo evidence
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                        JPEG · maximum 2 MB
                    </p>
                </div>

                {available && (
                    <span className="rounded-full bg-emerald-950/60 px-3 py-1 text-xs font-semibold text-emerald-300">
                        Attached
                    </span>
                )}
            </div>

            {loading && (
                <p className="mt-4 text-sm text-slate-400">
                    Loading photo...
                </p>
            )}

            {available && previewUrl && (
                <img
                    src={previewUrl}
                    alt="Daily record evidence"
                    className="mt-4 max-h-96 w-full rounded-xl border border-slate-800 bg-slate-900 object-contain"
                />
            )}

            {!available && readOnly && (
                <p className="mt-4 text-sm text-slate-500">
                    No photo evidence attached.
                </p>
            )}

            {error && (
                <p className="mt-4 rounded-lg border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300">
                    {error}
                </p>
            )}

            {!readOnly && (
                <div className="mt-4 flex flex-wrap gap-3">
                    <label
                        className={`
                            inline-flex cursor-pointer items-center
                            rounded-lg bg-sky-500 px-4 py-2
                            text-sm font-semibold text-slate-950
                            hover:bg-sky-400
                            ${busy ? "pointer-events-none opacity-50" : ""}
                        `}
                    >
                        {available ? "Replace photo" : "Add photo"}

                        <input
                            type="file"
                            accept="image/jpeg"
                            capture="environment"
                            disabled={busy}
                            className="sr-only"
                            onChange={event => {
                                const file = event.target.files?.[0];
                                event.target.value = "";
                                if (file) {
                                    void upload(file);
                                }
                            }}
                        />
                    </label>

                    {available && (
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => void remove()}
                            className="rounded-lg border border-red-900 bg-red-950/30 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-950/60 disabled:opacity-50"
                        >
                            Delete photo
                        </button>
                    )}

                    {available && (
                        <button
                            type="button"
                            disabled={busy || loading}
                            onClick={() => setReloadKey(value => value + 1)}
                            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                        >
                            Refresh preview
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default RecordPhoto;
