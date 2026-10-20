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
            className="border p-4 space-y-4"
        >
            <h2 className="text-xl font-bold">
                Send Tracking Request
            </h2>

            <div>
                <label htmlFor="receiverId">
                    Receiver User ID
                </label>

                <input
                    id="receiverId"
                    type="number"
                    min="1"
                    value={receiverId}
                    onChange={(event) =>
                        setReceiverId(event.target.value)
                    }
                    className="w-full border p-2"
                    required
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="border p-2 disabled:opacity-50"
            >
                {loading
                    ? "Sending..."
                    : "Send Request"}
            </button>
        </form>
    );
}

export default TrackingLinkForm;