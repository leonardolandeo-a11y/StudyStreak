import { useState, type SubmitEvent} from "react";

import type {
    DailyRecordRequest,
} from "../../types/dailyRecord";

interface DailyRecordFormProps {
    onSubmit: (dailyRecord: DailyRecordRequest) => Promise<void>;

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

        await onSubmit({date, note,evidence});

        if (resetAfterSubmit){
            setDate("");
            setNote("");
            setEvidence("");
        }
    }

    return (
    <form
        onSubmit={handleSubmit}
        className="space-y-4 border p-4"
    >
        <h2 className="text-xl font-bold">
            {submitLabel}
        </h2>

        <div>
            <label htmlFor="date">
                Date
            </label>

            <input
                id="date"
                type="date"
                value={date}
                max={today}
                onChange={(event) =>setDate(event.target.value)}
                className="w-full border p-2"
                required
            />
        </div>

        <div>
            <label htmlFor="note">
                Note
            </label>

            <textarea
                id="note"
                value={note}
                maxLength={1000}
                onChange={(event) =>setNote(event.target.value)}
                className="w-full border p-2"
            />
        </div>

        <div>
            <label htmlFor="evidence">
                Evidence
            </label>

            <input
                id="evidence"
                type="text"
                value={evidence}
                onChange={(event) =>setEvidence(event.target.value)}
                className="w-full border p-2"
            />
        </div>

        <button
            type="submit"
            disabled={loading}
            className="border p-2 disabled:opacity-50"
        >
            {loading ? "Saving..." : submitLabel}
        </button>
    </form>
    )
}

export default DailyRecordForm;