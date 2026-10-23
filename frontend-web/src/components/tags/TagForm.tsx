import {
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
            className="space-y-4 border p-4"
        >

            <div>

                <label htmlFor="tag-name">
                    Tag Name
                </label>

                <input
                    id="tag-name"
                    type="text"
                    value={name}
                    maxLength={50}
                    onChange={(event) =>
                        setName(
                            event.target.value
                        )
                    }
                    className="w-full border p-2"
                    required
                />

            </div>


            {error && (
                <p className="text-red-500">
                    {error}
                </p>
            )}


            <button
                type="submit"
                disabled={loading}
                className="border p-2 disabled:opacity-50"
            >
                {loading
                    ? "Saving..."
                    : submitLabel}
            </button>

        </form>
    );
}
export default TagForm;