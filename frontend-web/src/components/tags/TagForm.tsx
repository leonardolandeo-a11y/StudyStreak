import {
    useId,
    useState,
    type SubmitEvent
} from "react";

import type{
    TagRequest
} from "../../types/tag";

interface TagFormProps{
    onSubmit: (tag: TagRequest) => Promise<boolean>;

    loading: boolean;

    initialValue?: string;

    submitLabel?: string;

    resetAfterSubmit?: boolean;
}

function TagForm({onSubmit,loading,initialValue = "",submitLabel = "Create Tag",resetAfterSubmit = true}:TagFormProps){

    const [name, setName] =useState(initialValue);

    const [error, setError] =useState<string | null>(null);

    const inputId = useId();

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {

        event.preventDefault();

        const trimmedName = name.trim();


        if (trimmedName.length === 0) {

            setError("Tag name is required." );

            return;
        }


        if (trimmedName.length > 50) {

            setError("Tag name cannot exceed 50 characters.");
            return;
        }


        setError(null);


        const submitted = await onSubmit({  name: trimmedName });


        if (submitted &&resetAfterSubmit) {
            setName("");
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
                Add a short label to organize this goal.
            </p>
        </div>

        <div className="space-y-5">

            <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                    <label
                        htmlFor={inputId}
                        className="text-sm font-medium text-slate-300"
                    >
                        Tag Name
                    </label>

                    <span className="text-xs text-slate-500">
                        {name.length}/50
                    </span>
                </div>

                <input
                    id={inputId}
                    type="text"
                    value={name}
                    maxLength={50}
                    onChange={(event) =>
                        setName(event.target.value)
                    }
                    placeholder="Example: Database"
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

            {error && (
                <div
                    className="
                        rounded-lg
                        border border-red-900/60
                        bg-red-950/40
                        px-4 py-3
                        text-sm text-red-300
                    "
                >
                    {error}
                </div>
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
                {loading
                    ? "Saving..."
                    : submitLabel}
            </button>

        </div>
    </form>
    );
}
export default TagForm;