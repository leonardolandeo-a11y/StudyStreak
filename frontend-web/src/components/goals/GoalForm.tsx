import { useState, type SubmitEvent } from "react";
import type { GoalRequest } from "../../types/goal";

interface GoalFormProps{
    onSubmit: (goal:GoalRequest) =>Promise<void>;
    loading:boolean;

    initialValues?:GoalRequest;
    submitLabel?:string;
    resetAfterSubmit?:boolean;
}

function GoalForm({onSubmit,loading, initialValues,submitLabel="Create Goal", resetAfterSubmit=true}: GoalFormProps){

    const [topic, setTopic] = useState(initialValues?.topic?? "");
    const [frequency, setFrequency] = useState(initialValues?.frequency?? 1);
    const [duration, setDuration] = useState(initialValues?.duration?? 30);
    const [completed, setCompleted] = useState(initialValues?.completed?? false);

    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: SubmitEvent<HTMLFormElement> ) {
        event.preventDefault();

        const trimmedTopic =topic.trim();

        if (trimmedTopic.length === 0) {
            setError("Topic is required." );
            return;
        }

        if (!Number.isSafeInteger(frequency) || frequency <= 0) {
            setError( "Frequency must be a positive integer.");
            return;
        }

        if ( !Number.isSafeInteger(duration) || duration <= 0) {
            setError("Duration must be a positive integer." );
            return;
        }

        setError(null);

        await onSubmit({
            topic: trimmedTopic,
            frequency,
            duration,
            completed
        });

        if (resetAfterSubmit) {
            setTopic("");
            setFrequency(1);
            setDuration(30);
            setCompleted(false);
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
                Define the schedule and progress state for this goal.
            </p>
        </div>

        <div className="space-y-5">
            <div>
                <label
                    htmlFor="topic"
                    className="mb-2 block text-sm font-medium text-slate-300"
                >
                    Topic
                </label>

                <input
                    id="topic"
                    type="text"
                    value={topic}
                    onChange={(event) =>
                        setTopic(event.target.value)
                    }
                    placeholder="Example: Study databases"
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
                    required
                />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
                <div>
                    <label
                        htmlFor="frequency"
                        className="mb-2 block text-sm font-medium text-slate-300"
                    >
                        Frequency
                    </label>

                    <input
                        id="frequency"
                        type="number"
                        min="1"
                        step="1"
                        value={frequency}
                        onChange={(event) =>
                            setFrequency(
                                Number(event.target.value)
                            )
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
                    <label
                        htmlFor="duration"
                        className="mb-2 block text-sm font-medium text-slate-300"
                    >
                        Duration
                    </label>

                    <input
                        id="duration"
                        type="number"
                        min="1"
                        step="1"
                        value={duration}
                        onChange={(event) =>
                            setDuration(
                                Number(event.target.value)
                            )
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
            </div>

            <label
                className="
                    flex cursor-pointer items-center gap-3
                    rounded-lg
                    border border-slate-800
                    bg-slate-950/50
                    px-4 py-3
                "
            >
                <input
                    type="checkbox"
                    checked={completed}
                    onChange={(event) =>
                        setCompleted(event.target.checked)
                    }
                    className="h-4 w-4 accent-sky-500"
                />

                <div>
                    <p className="text-sm font-medium text-slate-200">
                        Completed
                    </p>

                    <p className="text-xs text-slate-500">
                        Mark this goal as already completed.
                    </p>
                </div>
            </label>

            {error && (
                <p
                    className="
                        rounded-lg
                        border border-red-900/60
                        bg-red-950/40
                        px-4 py-3
                        text-sm text-red-300
                    "
                >
                    {error}
                </p>
            )}

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
                {loading ? "Saving..." : submitLabel}
            </button>
        </div>
    </form>
    );
}
export default GoalForm;