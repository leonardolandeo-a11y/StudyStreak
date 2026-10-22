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
            className="space-y-4 border p-4"
        >
            <h2 className="text-xl font-bold">
                {submitLabel}
            </h2>

            <div>
                <label htmlFor="approved">
                    Decision
                </label>

                <select
                    id="approved"
                    value={approved}
                    onChange={(event) =>
                        setApproved(event.target.value)
                    }
                    className="w-full border p-2"
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
                <label htmlFor="comment">
                    Comment
                </label>

                <textarea
                    id="comment"
                    value={comment}
                    onChange={(event) =>
                        setComment(event.target.value)
                    }
                    maxLength={500}
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
export default ValidationForm;