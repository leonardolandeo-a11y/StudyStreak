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

import { Link } from "react-router-dom";
import {
    ROUTES
} from "../routes/paths";

import LoadingState from "../components/ui/LoadingState";

import ErrorMessage from "../components/ui/ErrorMessage";

import EmptyState from "../components/ui/EmptyState";

import PaginationControls from "../components/ui/PaginationControls";

function Goals(){
    const {currentUser} = useAuth();
    
    const [goalPage, setGoalPage] = useState<PageResponse<Goal> |null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string|null>(null);

    const [creating, setCreating] = useState(false);
    const [success,setSuccess] = useState<string|null>(null);

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
    async function handleCreateGoal(goal:GoalRequest){
        if (!currentUser){
            return;
        }
        try{
            setCreating(true);
            setError(null);
            setSuccess(null);   

            await createGoal(currentUser.id, goal);
            if (page ===0 ){
                const updatedGoals = await getGoals(currentUser.id,0,10);
                setGoalPage(updatedGoals);
            }else{
                setSearchParams({
                page:"0"
                });
            }
            

            setSuccess("Goal created successfully.");
        }catch{
            setError("Could not create goal.");
        }finally{
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
    <div className="p-6">
        <Link
            to={ROUTES.dashboard}
            className="inline-block mb-4 underline"
        >
            Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold">
            My Goals
        </h1>

        <div className="mt-6">
            <GoalForm
            onSubmit={handleCreateGoal}
            loading={creating}
            />
        </div>

        {success && (
            <p className="mt-4 text-green-500">
            {success}
            </p>
        )}

        {goalPage.empty && (
            <EmptyState
                message="No goals yet."
            />
        )}

        {!goalPage.empty && (
            <div className="mt-6 space-y-4">
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
    </div>
    );

}
export default Goals;
