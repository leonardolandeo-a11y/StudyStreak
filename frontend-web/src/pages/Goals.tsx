import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { getGoals,
        createGoal
} from "../services/goalService";

import GoalForm from "../components/goals/GoalForm";

import type { Goal,GoalRequest } from "../types/goal";
import type { PageResponse } from "../types/page";
import GoalCard from "../components/goals/GoalCard";

import { useSearchParams } from "react-router-dom";


import LoadingState from "../components/ui/LoadingState";

import ErrorMessage from "../components/ui/ErrorMessage";

import EmptyState from "../components/ui/EmptyState";

import PaginationControls from "../components/ui/PaginationControls";

import { useToast } from "../hooks/useToast";

function Goals(){
    const {currentUser} = useAuth();
    const { showToast } = useToast();

    const [goalPage, setGoalPage] = useState<PageResponse<Goal> |null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string|null>(null);

    const [creating, setCreating] = useState(false);

    const [searchParams, setSearchParams] = useSearchParams();

    const pageParam = Number(searchParams.get("page")?? "0");
    const page = Number.isInteger(pageParam) && pageParam >= 0 ? pageParam: 0;

    function goToPreviousPage(){
        if (page<= 0){
            return;
        }
        setSearchParams({
            page:String(page-1)
        });
    }
    function goToNextPage(){
        if (!goalPage||goalPage.last){
            return;
        }
        setSearchParams({
            page : String(page+1)
        })
    }
    async function handleCreateGoal(goal: GoalRequest) {
        if (!currentUser) {
            return;
        }

        try {
            setCreating(true);

            await createGoal( currentUser.id, goal );


            if (page === 0) {

                const updatedGoals = await getGoals( currentUser.id, 0, 10);
                setGoalPage(updatedGoals);

            } else {

                setSearchParams({
                    page: "0"
                });
            }


            showToast("Goal created successfully.", "success");

        } catch {
            showToast("Could not create goal.","error");

        } finally {

            setCreating(false);
        }
    }

    const userId = currentUser?.id;
    useEffect(() => {

        if (userId == null) {
            return;
        }

        const controller =new AbortController();


        async function loadGoals(id: number) {

            try {

                setLoading(true);
                setError(null);

                const response = await getGoals(id,page,10,controller.signal);
                setGoalPage(response);

            } catch {

                if (!controller.signal.aborted) {
                    setError("Could not load goals." );
                }

            } finally {

                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }


        void loadGoals(userId);


        return () => {
            controller.abort();
        };

    }, [userId, page]);

    if (!currentUser) {
        return <p>Please log in to view your goals.</p>;
    }
    if (loading){
        return (<LoadingState
            message="Loading goals..."
        />);
    }
    if (error){
        return (<ErrorMessage message={error}></ErrorMessage>);
    }
    if (!goalPage){
        return null;
    }
return(
    <div className="space-y-8">

        <section>
            <p className="text-sm font-medium text-sky-400">
                Goals
            </p>

            <h1
                className="
                    mt-2
                    text-3xl font-bold
                    tracking-tight
                    text-slate-100
                "
            >
                My Goals
            </h1>

            <p className="mt-2 max-w-2xl text-slate-400">
                Create study goals, track their progress,
                and manage their daily records.
            </p>
        </section>


        <section>
            <GoalForm
                onSubmit={handleCreateGoal}
                loading={creating}
            />
        </section>

        <section>
            <div
                className="
                    mb-5
                    flex flex-wrap
                    items-end
                    justify-between
                    gap-3
                "
            >
                <div>
                    <h2 className="text-xl font-semibold text-slate-100">
                        Your goals
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                        Review and manage your current study goals.
                    </p>
                </div>

                {!goalPage.empty && (
                    <span
                        className="
                            rounded-full
                            border border-slate-800
                            bg-slate-900
                            px-3 py-1
                            text-xs font-medium
                            text-slate-400
                        "
                    >
                        {goalPage.totalElements} total
                    </span>
                )}
            </div>


            {goalPage.empty && (
                <EmptyState
                    message="No goals yet. Create your first goal above."
                />
            )}


            {!goalPage.empty && (
                <div
                    className="
                        grid gap-4
                        lg:grid-cols-2
                    "
                >
                    {goalPage.content.map((goal) => (
                        <GoalCard
                            key={goal.id}
                            goal={goal}
                        />
                    ))}
                </div>
            )}


            {!goalPage.empty && (
                <PaginationControls
                    page={page}
                    totalPages={goalPage.totalPages}
                    first={goalPage.first}
                    last={goalPage.last}
                    onPrevious={goToPreviousPage}
                    onNext={goToNextPage}
                />
            )}
        </section>

    </div>
    );

}
export default Goals;
