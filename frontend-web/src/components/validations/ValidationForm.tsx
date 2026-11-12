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

    const [confirming, setConfirming] = useState(false);
    const [comment, setComment] = useState(initialValues?.comment ?? "");

    async function handleSubmit(event:SubmitEvent<HTMLFormElement>){
        event.preventDefault();

        if (approved === "" || loading) return;
        if (!confirming) { setConfirming(true); return; }
        const submitted = await onSubmit({approved: approved ==="true",comment});

        if (submitted && resetAfterSubmit){
            setConfirming(false);
            setApproved("");
            setComment("");
        }
    }
    if (confirming) return <form onSubmit={handleSubmit} className="workflow-form space-y-4" aria-label="Confirm validation decision">
        <h3 className="text-lg font-bold">Confirm your decision</h3><p className="font-semibold">{approved === 'true' ? 'Approve' : 'Reject'}</p><p className="whitespace-pre-wrap break-words text-content-secondary">{comment || 'No comment'}</p>
        <p className="text-xs text-content-muted">This decision will be saved for the selected daily record.</p>
        <div className="flex flex-wrap gap-2"><button type="button" className="study-button" disabled={loading} onClick={() => setConfirming(false)}>Edit decision</button><button className="study-button bg-accent text-on-accent" disabled={loading}>{loading ? 'Saving...' : submitLabel}</button></div>
    </form>;
    return (
    <form
        onSubmit={handleSubmit}
        className="workflow-form"
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
                        border border-outline-strong
                        bg-slate-950
                        px-3 py-2.5
                        text-slate-100
                        hover:border-outline-strong
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
                        border border-outline-strong
                        bg-slate-950
                        px-3 py-2.5
                        text-slate-100
                        placeholder:text-slate-600
                        hover:border-outline-strong
                    "
                />
            </div>


            <button
                type="submit"
                disabled={loading || approved === ""}
                className="
                    rounded-lg
                    bg-sky-500
                    px-4 py-2.5
                    text-sm font-semibold
                    text-on-accent
                    hover:bg-sky-400
                    disabled:opacity-50
                "
            >
                {loading
                    ? "Saving..."
                    : "Review decision"}
            </button>

        </div>
    </form>
    )
}
export default ValidationForm;