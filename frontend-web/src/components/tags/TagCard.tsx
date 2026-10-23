import {
    useState
} from "react";

import type {
    Tag,
    TagRequest
} from "../../types/tag";

import TagForm
    from "./TagForm";


interface TagCardProps {
    tag: Tag;

    onUpdate: (tagId: number,tag: TagRequest ) => Promise<boolean>;

    onDelete: (tagId: number ) => Promise<void>;

    updatingId: number | null;

    deletingId: number | null;
}


function TagCard({tag,onUpdate,onDelete,updatingId,deletingId}: TagCardProps) {

    const [editing, setEditing] =useState(false);


    async function handleUpdate(tagRequest: TagRequest): Promise<boolean> {

        const updated =await onUpdate( tag.id, tagRequest);

        if (updated) {
            setEditing(false);
        }

        return updated;
    }


    return (
        <div className="border p-4">

            {!editing && (
                <>
                    <p className="font-semibold">
                        {tag.name}
                    </p>

                    <div className="mt-3 flex gap-3">

                        <button
                            type="button"
                            onClick={() =>
                                setEditing(true)
                            }
                            className="border p-2"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                onDelete(tag.id)
                            }
                            disabled={
                                deletingId === tag.id
                            }
                            className="border p-2 text-red-500 disabled:opacity-50"
                        >
                            {deletingId === tag.id
                                ? "Deleting..."
                                : "Delete"}
                        </button>

                    </div>
                </>
            )}


            {editing && (
                <div className="space-y-3">

                    <TagForm
                        onSubmit={handleUpdate}
                        loading={
                            updatingId === tag.id
                        }
                        initialValue={tag.name}
                        submitLabel="Update Tag"
                        resetAfterSubmit={false}
                    />

                    <button
                        type="button"
                        onClick={() =>
                            setEditing(false)
                        }
                        className="border p-2"
                    >
                        Cancel
                    </button>

                </div>
            )}

        </div>
    );
}


export default TagCard;