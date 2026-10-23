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
    <article
        className="
            rounded-2xl
            border border-slate-800
            bg-slate-900/70
            p-5
            shadow-lg shadow-black/10
        "
    >
        {!editing && (
            <>
                <div
                    className="
                        flex flex-wrap
                        items-center
                        justify-between
                        gap-4
                    "
                >
                    <div>
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                            Tag
                        </p>

                        <p className="mt-1 text-lg font-semibold text-slate-100">
                            {tag.name}
                        </p>
                    </div>

                    <span
                        className="
                            rounded-full
                            bg-sky-950/60
                            px-3 py-1
                            text-xs font-semibold
                            text-sky-300
                        "
                    >
                        #{tag.id}
                    </span>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">

                    <button
                        type="button"
                        onClick={() =>
                            setEditing(true)
                        }
                        className="
                            rounded-lg
                            border border-slate-700
                            bg-slate-950
                            px-4 py-2
                            text-sm font-medium
                            text-slate-200
                            hover:border-slate-600
                            hover:bg-slate-800
                        "
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
                        className="
                            rounded-lg
                            border border-red-900
                            bg-red-950/30
                            px-4 py-2
                            text-sm font-medium
                            text-red-300
                            hover:bg-red-950/60
                            disabled:opacity-50
                        "
                    >
                        {deletingId === tag.id
                            ? "Deleting..."
                            : "Delete"}
                    </button>

                </div>
            </>
        )}


        {editing && (
            <div className="space-y-4">

                <div>
                    <p className="text-sm font-medium text-sky-400">
                        Editing tag
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                        Update the tag name below.
                    </p>
                </div>

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
                    className="
                        rounded-lg
                        border border-slate-700
                        bg-slate-950
                        px-4 py-2
                        text-sm font-medium
                        text-slate-300
                        hover:bg-slate-800
                    "
                >
                    Cancel
                </button>

            </div>
        )}
    </article>
    );
}


export default TagCard;