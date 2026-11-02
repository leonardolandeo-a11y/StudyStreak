import {
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";

import {
    deleteRecordVoice,
    downloadRecordVoice,
    uploadRecordVoice
} from "../../services/voiceEvidenceService";

import {
    getApiErrorMessage
} from "../../utils/apiError";

import {
    useToast
} from "../../hooks/useToast";

import {
    useConfirm
} from "../../hooks/useConfirm";

interface RecordVoiceProps {
    goalId:number;
    recordId:number;
    available:boolean;
    readOnly?:boolean;
    onChanged?:() => void;
}

const MAX_VOICE_SIZE =
    2 * 1024 * 1024;

const MAX_RECORDING_MS =
    90_000;

function RecordVoice({
    goalId,
    recordId,
    available,
    readOnly = false,
    onChanged
}:RecordVoiceProps) {
    const { showToast } = useToast();
    const confirm = useConfirm();

    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [recordedFile, setRecordedFile] = useState<File | null>(null);
    const recordedUrl = useMemo(
        () => recordedFile
            ? URL.createObjectURL(recordedFile)
            : null,
        [recordedFile]
    );
    const [recording, setRecording] = useState(false);
    const [recordingSeconds, setRecordingSeconds] = useState(0);
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    const recorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const stopTimerRef = useRef<number | null>(null);
    const secondsTimerRef = useRef<number | null>(null);

    function clearRecordingTimers() {
        if (stopTimerRef.current !== null) {
            window.clearTimeout(stopTimerRef.current);
            stopTimerRef.current = null;
        }

        if (secondsTimerRef.current !== null) {
            window.clearInterval(secondsTimerRef.current);
            secondsTimerRef.current = null;
        }
    }

    function stopStream() {
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }

    useEffect(() => {
        return () => {
            clearRecordingTimers();

            if (
                recorderRef.current &&
                recorderRef.current.state !== "inactive"
            ) {
                recorderRef.current.stop();
            }

            stopStream();
        };
    }, []);

    useEffect(() => {
        if (!available) {
            return;
        }

        const controller = new AbortController();
        let objectUrl:string | null = null;

        async function loadVoice() {
            try {
                setLoading(true);
                setError(null);

                const blob = await downloadRecordVoice(
                    goalId,
                    recordId,
                    controller.signal
                );

                if (controller.signal.aborted) {
                    return;
                }

                objectUrl = URL.createObjectURL(blob);
                setAudioUrl(objectUrl);

            } catch (cause) {
                if (!controller.signal.aborted) {
                    setError(
                        getApiErrorMessage(
                            cause,
                            "Unable to load the saved voice note."
                        )
                    );
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        void loadVoice();

        return () => {
            controller.abort();

            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };

    }, [
        available,
        goalId,
        recordId,
        reloadKey
    ]);

    useEffect(() => {
        return () => {
            if (recordedUrl) {
                URL.revokeObjectURL(recordedUrl);
            }
        };
    }, [recordedUrl]);

    function validateM4a(file:File):string | null {
        const validType =
            [
                "audio/mp4",
                "audio/m4a",
                "audio/x-m4a"
            ].includes(file.type) ||
            file.name.toLowerCase().endsWith(".m4a");

        if (!validType) {
            return "Voice evidence must be an M4A file.";
        }

        if (
            file.size <= 0 ||
            file.size > MAX_VOICE_SIZE
        ) {
            return "Voice evidence must be 2 MB or smaller.";
        }

        return null;
    }

    async function upload(file:File) {
        const validationError = validateM4a(file);

        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setBusy(true);
            setError(null);

            await uploadRecordVoice(goalId, recordId, file);
            setRecordedFile(null);

            showToast(
                available
                    ? "Voice note replaced."
                    : "Voice note added.",
                "success"
            );

            setReloadKey(value => value + 1);
            onChanged?.();

        } catch (cause) {
            setError(
                getApiErrorMessage(
                    cause,
                    "Could not save the voice note."
                )
            );
        } finally {
            setBusy(false);
        }
    }

    function stopRecording() {
        if (
            recorderRef.current &&
            recorderRef.current.state !== "inactive"
        ) {
            recorderRef.current.stop();
        }
    }

    async function startRecording() {
        setError(null);
        setRecordedFile(null);

        if (
            !navigator.mediaDevices?.getUserMedia ||
            typeof MediaRecorder === "undefined"
        ) {
            setError(
                "This browser cannot record audio. Upload an M4A file instead."
            );
            return;
        }

        const mimeType =
            [
                "audio/mp4;codecs=mp4a.40.2",
                "audio/mp4"
            ].find(type =>
                MediaRecorder.isTypeSupported(type)
            );

        if (!mimeType) {
            setError(
                "This browser cannot record M4A directly. Upload an .m4a file instead."
            );
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio:true
            });

            streamRef.current = stream;
            chunksRef.current = [];

            const recorder = new MediaRecorder(
                stream,
                { mimeType }
            );

            recorderRef.current = recorder;

            recorder.ondataavailable = event => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            recorder.onstop = () => {
                clearRecordingTimers();
                stopStream();
                setRecording(false);

                const blob = new Blob(
                    chunksRef.current,
                    { type:"audio/mp4" }
                );

                chunksRef.current = [];

                if (blob.size <= 0) {
                    setError(
                        "The recording is empty. Try again."
                    );
                    return;
                }

                if (blob.size > MAX_VOICE_SIZE) {
                    setError(
                        "The recording exceeds 2 MB. Record a shorter note."
                    );
                    return;
                }

                setRecordedFile(
                    new File(
                        [blob],
                        `study-note-${recordId}.m4a`,
                        { type:"audio/mp4" }
                    )
                );
            };

            recorder.start();

            setRecording(true);
            setRecordingSeconds(0);

            secondsTimerRef.current = window.setInterval(
                () => setRecordingSeconds(value => value + 1),
                1000
            );

            stopTimerRef.current = window.setTimeout(
                stopRecording,
                MAX_RECORDING_MS
            );

        } catch {
            clearRecordingTimers();
            stopStream();

            setError(
                "Microphone access failed. Check browser permissions or upload an M4A file."
            );
        }
    }

    async function remove() {
        const confirmed = await confirm({
            title:"Delete voice note?",
            message:
                "This voice note will be permanently removed from the daily record.",
            confirmLabel:"Delete voice",
            cancelLabel:"Cancel",
            variant:"danger"
        });

        if (!confirmed) {
            return;
        }

        try {
            setBusy(true);
            setError(null);

            await deleteRecordVoice(goalId, recordId);

            showToast(
                "Voice note deleted.",
                "success"
            );

            onChanged?.();

        } catch (cause) {
            setError(
                getApiErrorMessage(
                    cause,
                    "Could not delete the voice note."
                )
            );
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                        Voice evidence
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                        M4A · up to 90 seconds · maximum 2 MB
                    </p>
                </div>

                {available && (
                    <span className="rounded-full bg-violet-950/60 px-3 py-1 text-xs font-semibold text-violet-300">
                        Attached
                    </span>
                )}
            </div>

            {loading && (
                <p className="mt-4 text-sm text-slate-400">
                    Loading voice note...
                </p>
            )}

            {available && audioUrl && (
                <audio
                    className="mt-4 w-full"
                    controls
                    preload="metadata"
                    src={audioUrl}
                />
            )}

            {!available && readOnly && (
                <p className="mt-4 text-sm text-slate-500">
                    No voice evidence attached.
                </p>
            )}

            {recording && (
                <div className="mt-4 rounded-lg border border-red-900/60 bg-red-950/20 px-4 py-3">
                    <p className="font-medium text-red-300">
                        Recording · {recordingSeconds}s
                    </p>

                    <button
                        type="button"
                        onClick={stopRecording}
                        className="mt-3 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400"
                    >
                        Finish recording
                    </button>
                </div>
            )}

            {recordedFile && recordedUrl && (
                <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/70 p-4">
                    <p className="text-sm font-medium text-slate-200">
                        Recording ready
                    </p>

                    <audio
                        className="mt-3 w-full"
                        controls
                        src={recordedUrl}
                    />

                    <div className="mt-3 flex flex-wrap gap-3">
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => void upload(recordedFile)}
                            className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-50"
                        >
                            Save recording
                        </button>

                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => setRecordedFile(null)}
                            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                        >
                            Discard
                        </button>
                    </div>
                </div>
            )}

            {error && (
                <p className="mt-4 rounded-lg border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-300">
                    {error}
                </p>
            )}

            {!readOnly && (
                <div className="mt-4 flex flex-wrap gap-3">
                    {!recording && (
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => void startRecording()}
                            className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-400 disabled:opacity-50"
                        >
                            Record voice note
                        </button>
                    )}

                    <label
                        className={`
                            inline-flex cursor-pointer items-center
                            rounded-lg border border-slate-700
                            px-4 py-2 text-sm font-medium
                            text-slate-300 hover:bg-slate-800
                            ${busy || recording ? "pointer-events-none opacity-50" : ""}
                        `}
                    >
                        Upload .m4a

                        <input
                            type="file"
                            accept=".m4a,audio/mp4,audio/m4a,audio/x-m4a"
                            disabled={busy || recording}
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
                            disabled={busy || recording}
                            onClick={() => void remove()}
                            className="rounded-lg border border-red-900 bg-red-950/30 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-950/60 disabled:opacity-50"
                        >
                            Delete voice note
                        </button>
                    )}

                    {available && (
                        <button
                            type="button"
                            disabled={busy || loading || recording}
                            onClick={() => setReloadKey(value => value + 1)}
                            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                        >
                            Refresh audio
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default RecordVoice;
