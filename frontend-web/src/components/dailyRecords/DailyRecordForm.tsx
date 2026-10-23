import { useState, type SubmitEvent} from "react";

import type {
    DailyRecordRequest,
} from "../../types/dailyRecord";

interface DailyRecordFormProps {
    onSubmit: (dailyRecord: DailyRecordRequest) => Promise<boolean>;

    loading: boolean;
    initialValues?: DailyRecordRequest;
    submitLabel?: string;
    resetAfterSubmit?: boolean;
}

function DailyRecordForm({
    onSubmit,
    loading,
    initialValues,
    submitLabel = "Create Daily Record",
    resetAfterSubmit = true,
}: DailyRecordFormProps) {
    const [date, setDate] = useState(initialValues?.date ?? "");

    const [note, setNote] = useState(initialValues?.note ?? "");

    const [evidence, setEvidence] = useState(initialValues?.evidence ?? "");

    const now = new Date();

    const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;

    async function handleSubmit(event : SubmitEvent<HTMLFormElement>){
        event.preventDefault();

        const submitted = await onSubmit({date, note,evidence});

        if (submitted && resetAfterSubmit){
            setDate("");
            setNote("");
            setEvidence("");
        }
    }

    return (
    <form
        onSubmit={handleSubmit}
        className="
            rounded-2xl
            border border-slate-800
            bg-slate-900/70
            p-6
            shadow-lg shadow-black/10
        "
    >
        <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-100">
                {submitLabel}
            </h2>

            <p className="mt-1 text-sm text-slate-400">
                Record your progress and attach any useful evidence.
            </p>
        </div>


        <div className="space-y-5">

            <div>
                <label
                    htmlFor="date"
                    className="mb-2 block text-sm font-medium text-slate-300"
                >
                    Date
                </label>

                <input
                    id="date"
                    type="date"
                    value={date}
                    max={today}
                    onChange={(event) =>
                        setDate(event.target.value)
                    }
                    className="
                        w-full
                        rounded-lg
                        border border-slate-700
                        bg-slate-950
                        px-3 py-2.5
                        text-slate-100
                        hover:border-slate-600
                    "
                    required
                />
            </div>


            <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                    <label
                        htmlFor="note"
                        className="text-sm font-medium text-slate-300"
                    >
                        Note
                    </label>

                    <span className="text-xs text-slate-500">
                        {note.length}/1000
                    </span>
                </div>

                <textarea
                    id="note"
                    value={note}
                    maxLength={1000}
                    rows={5}
                    onChange={(event) =>
                        setNote(event.target.value)
                    }
                    placeholder="What did you accomplish today?"
                    className="
                        w-full
                        resize-y
                        rounded-lg
                        border border-slate-700
                        bg-slate-950
                        px-3 py-2.5
                        text-slate-100
                        placeholder:text-slate-600
                        hover:border-slate-600
                    "
                />
            </div>


            <div>
                <label
                    htmlFor="evidence"
                    className="mb-2 block text-sm font-medium text-slate-300"
                >
                    Evidence
                </label>

                <input
                    id="evidence"
                    type="text"
                    value={evidence}
                    onChange={(event) =>
                        setEvidence(event.target.value)
                    }
                    placeholder="Link, reference, or evidence description"
                    className="
                        w-full
                        rounded-lg
                        border border-slate-700
                        bg-slate-950
                        px-3 py-2.5
                        text-slate-100
                        placeholder:text-slate-600
                        hover:border-slate-600
                    "
                />
            </div>


            <button
                type="submit"
                disabled={loading}
                className="
                    rounded-lg
                    bg-sky-500
                    px-4 py-2.5
                    text-sm font-semibold
                    text-slate-950
                    hover:bg-sky-400
                    disabled:opacity-50
                "
            >
                {loading
                    ? "Saving..."
                    : submitLabel}
            </button>

        </div>
    </form>
    )
}

export default DailyRecordForm;