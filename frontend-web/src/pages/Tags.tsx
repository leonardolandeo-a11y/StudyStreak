import {
    useEffect,
    useState
} from "react";

import {
    useParams,
    useSearchParams
} from "react-router-dom";

import {
    getTags,
    createTag,
    updateTag,
    deleteTag
} from "../services/tagService";

import {
    useAuth
} from "../hooks/useAuth";

import type {
    Tag,
    TagRequest
} from "../types/tag";

import type {
    PageResponse
} from "../types/page";

import TagForm
    from "../components/tags/TagForm";

import TagCard
    from "../components/tags/TagCard";

import LoadingState
    from "../components/ui/LoadingState";

import ErrorMessage
    from "../components/ui/ErrorMessage";

import EmptyState
    from "../components/ui/EmptyState";

import PaginationControls
    from "../components/ui/PaginationControls";

const PAGE_SIZE = 10;

function Tags() {

    const { currentUser } = useAuth();

    const { goalId } = useParams();

    const [searchParams,setSearchParams] = useSearchParams();


    const [tagPage, setTagPage] =useState<PageResponse<Tag> | null>( null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState<string | null>(null);

    const [success, setSuccess] = useState<string | null>(null);

    const [creating, setCreating] = useState(false);

    const [updatingId, setUpdatingId] =  useState<number | null>(null);

    const [deletingId, setDeletingId] = useState<number | null>(null);


    const userId = currentUser?.id;

    const parsedGoalId = goalId ? Number(goalId) : null;

    const invalidGoalId = parsedGoalId === null || !Number.isSafeInteger(parsedGoalId) ||  parsedGoalId <= 0;


    const pageParam = Number(searchParams.get("page") ?? "0" );

    const page = Number.isSafeInteger(pageParam) && pageParam >= 0 ? pageParam : 0;

    function handlePageChange(newPage: number) {
        if (newPage < 0) {
            return;
        }

        setSearchParams({
            page: String(newPage)
        });
    }


    async function handleCreateTag(tagRequest: TagRequest): Promise<boolean> {

        if (!userId || parsedGoalId === null) {
            return false;
        }

        try {

            setCreating(true);
            setError(null);
            setSuccess(null);


            await createTag(userId,parsedGoalId,tagRequest);


            if (page === 0) {

                const updatedTags =await getTags(userId, parsedGoalId, 0,  PAGE_SIZE );

                setTagPage(updatedTags);

            } else {

                handlePageChange(0);
            }


            setSuccess("Tag created successfully.");

            return true;

        } catch {
            setError("Could not create tag.");
            return false;

        } finally {
            setCreating(false);
        }
    }


    async function handleUpdateTag(tagId: number,tagRequest: TagRequest): Promise<boolean> {

        if (!userId || parsedGoalId === null) {
            return false;
        }

        try {

            setUpdatingId(tagId);
            setError(null);
            setSuccess(null);


            const updatedTag = await updateTag( userId, parsedGoalId, tagId, tagRequest );


            setTagPage((currentPage) => {

                if (!currentPage) {
                    return currentPage;
                }

                return {
                    ...currentPage,
                    content:
                        currentPage.content.map(
                            (tag) =>
                                tag.id === updatedTag.id
                                    ? updatedTag
                                    : tag
                        )
                };
            });


            setSuccess(  "Tag updated successfully." );

            return true;

        } catch {

            setError( "Could not update tag.");
            return false;

        } finally {

            setUpdatingId(null);
        }
    }


    async function handleDeleteTag(tagId: number): Promise<void> {

        if (!userId ||parsedGoalId === null) {
            return;
        }


        const confirmed =window.confirm("Remove this tag from the goal?");

        if (!confirmed) {
            return;
        }


        try {

            setDeletingId(tagId);
            setError(null);
            setSuccess(null);


            await deleteTag( userId, parsedGoalId, tagId);


            if (tagPage?.content.length === 1 &&page > 0) {

                handlePageChange(page - 1);
            } else {

                const updatedTags =await getTags(userId,parsedGoalId,page,PAGE_SIZE);
                setTagPage(updatedTags);
            }


            setSuccess("Tag removed successfully.");

        } catch {

            setError("Could not remove tag.");

        } finally {

            setDeletingId(null);
        }
    }


    useEffect(() => {

        if (userId == null ||parsedGoalId === null ||invalidGoalId) {
            return;
        }


        const controller =new AbortController();


        async function loadTags(id: number,goalNumber: number) {

            try {

                setLoading(true);
                setError(null);


                const response =await getTags(id,goalNumber,page,PAGE_SIZE,controller.signal);
                setTagPage(response);

            } catch {

                if (!controller.signal.aborted) {
                    setError("Could not load tags.");
                }

            } finally {

                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }


        void loadTags(userId, parsedGoalId);


        return () => {
            controller.abort();
        };

    }, [
        userId,
        parsedGoalId,
        invalidGoalId,
        page
    ]);


    if (!currentUser) {
        return null;
    }


    if (invalidGoalId) {
        return (
            <ErrorMessage
                message="Invalid goal id."
            />
        );
    }


    if (loading) {
        return (
            <LoadingState
                message="Loading tags..."
            />
        );
    }


    if (error && !tagPage) {
        return (
            <ErrorMessage
                message={error}
            />
        );
    }


    if (
        !tagPage ||
        parsedGoalId === null
    ) {
        return null;
    }


    return (
        <div className="p-6">

            <h1 className="text-3xl font-bold">
                Tags
            </h1>


            <div className="mt-6">

                <TagForm
                    onSubmit={handleCreateTag}
                    loading={creating}
                />

            </div>


            {success && (
                <p className="mt-4 text-green-500">
                    {success}
                </p>
            )}


            {error && (
                <ErrorMessage
                    message={error}
                />
            )}


            {tagPage.empty && (
                <EmptyState
                    message="No tags yet."
                />
            )}


            {!tagPage.empty && (
                <div className="mt-6 space-y-4">

                    {tagPage.content.map(
                        (tag) => (
                            <TagCard
                                key={tag.id}
                                tag={tag}
                                onUpdate={
                                    handleUpdateTag
                                }
                                onDelete={
                                    handleDeleteTag
                                }
                                updatingId={
                                    updatingId
                                }
                                deletingId={
                                    deletingId
                                }
                            />
                        )
                    )}

                </div>
            )}


            {!tagPage.empty && (
                <PaginationControls
                    page={page}
                    totalPages={tagPage.totalPages}
                    first={tagPage.first}
                    last={tagPage.last}
                    onPrevious={() =>
                        handlePageChange(page - 1)
                    }
                    onNext={() =>
                        handlePageChange(page + 1)
                    }
                />
            )}

        </div>
    );
}


export default Tags;