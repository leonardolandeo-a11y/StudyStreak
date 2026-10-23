import {
    useState,
    type SubmitEvent
} from "react";

interface TrackingLinkFormProps {
    onSubmit: (receiverId: number) => Promise<boolean>;
    loading: boolean;
}

function TrackingLinkForm({onSubmit,loading}: TrackingLinkFormProps) {

    const [receiverId, setReceiverId] = useState("");

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        const parsedReceiverId =Number(receiverId);

        if (!Number.isSafeInteger(parsedReceiverId) || parsedReceiverId <= 0) {
            return;
        }

        const submitted = await onSubmit(parsedReceiverId);

        if (submitted) {
            setReceiverId("");
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
                Tracking
            </p>

            <h2 className="mt-1 text-xl font-semibold text-slate-100">
                Send Tracking Request
            </h2>

            <p className="mt-1 text-sm text-slate-400">
                Enter another user's ID to request a tracking connection.
            </p>
        </div>


        <div className="space-y-5">

            <div>
                <label
                    htmlFor="receiverId"
                    className="mb-2 block text-sm font-medium text-slate-300"
                >
                    Receiver User ID
                </label>

                <input
                    id="receiverId"
                    type="number"
                    min="1"
                    step="1"
                    value={receiverId}
                    onChange={(event) =>
                        setReceiverId(event.target.value)
                    }
                    placeholder="Example: 12"
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

                <p className="mt-2 text-xs text-slate-500">
                    You can find your own user ID on the Dashboard.
                </p>
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
                    ? "Sending..."
                    : "Send Request"}
            </button>

        </div>
    </form>
    );
}

export default TrackingLinkForm;