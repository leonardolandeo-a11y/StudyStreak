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


    async function handleSubmit(event: SubmitEvent<HTMLFormElement>){
        event.preventDefault();

        await onSubmit({
            topic,
            frequency,
            duration,
            completed,
        });
        if (resetAfterSubmit){
            setTopic("");
            setFrequency(1);
            setDuration(30);
            setCompleted(false);
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
            <label htmlFor="topic">
                Topic
            </label>

            <input
                id="topic"
                type="text"
                value={topic}
                onChange={(event) =>setTopic(event.target.value)}
                className="w-full border p-2"
                required
            />
        </div>

        <div>
            <label htmlFor="frequency">
                Frequency
            </label>

            <input
                id="frequency"
                type="number"
                min="1"
                value={frequency}
                onChange={(event) =>setFrequency(Number(event.target.value))}
                className="w-full border p-2"
                required
            />
        </div>

        <div>
            <label htmlFor="duration">
                Duration
            </label>

            <input
                id="duration"
                type="number"
                min="1"
                value={duration}
                onChange={(event) =>setDuration(Number(event.target.value))}
                className="w-full border p-2"
                required
            />
        </div>

        <div>
            <label>
                <input
                    type="checkbox"
                    checked={completed}
                    onChange={(event) =>setCompleted(event.target.checked)}
                />

                <span className="ml-2">
                    Completed
                </span>
            </label>
        </div>

        <button
            type="submit"
            disabled={loading}
            className="border p-2"
        >
            {loading ? "Saving..." : submitLabel}
        </button>
    </form>
    );
}
export default GoalForm;