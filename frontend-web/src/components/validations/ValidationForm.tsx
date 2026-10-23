import {
    useState,
    type SubmitEvent
} from "react";

import type{
    ValidationRequest
} from "../../types/validation";

interface ValidationFormProps{
    onSubmit: (validation:ValidationRequest) => Promise<boolean>;
    
    loading : boolean;

    initialValues?: ValidationRequest;

    submitLabel?:string;

    resetAfterSubmit?:boolean;
}

function ValidationForm({onSubmit,loading,initialValues,submitLabel= "Submit validation",resetAfterSubmit = true}:ValidationFormProps){

    const [approved,setApproved] = useState<string>(initialValues? String(initialValues.approved) : "");

    const [comment, setComment] = useState(initialValues?.comment ?? "");

    async function handleSubmit(event:SubmitEvent<HTMLFormElement>){
        event.preventDefault();

        if (approved === ""){
            return;
        }
        const submitted = await onSubmit({approved: approved ==="true",comment});

        if (submitted && resetAfterSubmit){
            setApproved("");
            setComment("");
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
            <p className="text-sm font-medium text-sky-400">
                Validation
            </p>

            <h2 className="mt-1 text-xl font-semibold text-slate-100">
                {submitLabel}
            </h2>

            <p className="mt-1 text-sm text-slate-400">
                Review the progress record and provide your decision.
            </p>
        </div>


        <div className="space-y-5">

            <div>
                <label
                    htmlFor="approved"
                    className="mb-2 block text-sm font-medium text-slate-300"
                >
                    Decision
                </label>

                <select
                    id="approved"
                    value={approved}
                    onChange={(event) =>
                        setApproved(event.target.value)
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
                >
                    <option value="">
                        Select a decision
                    </option>

                    <option value="true">
                        Approve
                    </option>

                    <option value="false">
                        Reject
                    </option>
                </select>
            </div>


            <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                    <label
                        htmlFor="comment"
                        className="text-sm font-medium text-slate-300"
                    >
                        Comment
                    </label>

                    <span className="text-xs text-slate-500">
                        {comment.length}/500
                    </span>
                </div>

                <textarea
                    id="comment"
                    value={comment}
                    onChange={(event) =>
                        setComment(event.target.value)
                    }
                    maxLength={500}
                    rows={5}
                    placeholder="Add feedback about this progress record..."
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
export default ValidationForm;