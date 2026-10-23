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
    useEffect(()=>{
        if (userId == null){
            return;
        }
        let cancelled = false;
        async function loadGoals(id :number){
            try{
                setLoading(true);
                setError(null);

                const response = await getGoals(id, page,10);
                if (!cancelled){
                    setGoalPage(response)
                }
            }catch{
                if (!cancelled){
                    setError("Could not load goals.");
                }
                
            
            }finally{
                if (!cancelled){
                setLoading(false);
                }
            }
        }
        void loadGoals(userId);

        return ()=>{
            cancelled = true;
        }

    },[userId,page]);
    if (!currentUser) {
        return <p>Please log in to view your goals.</p>;
    }
    if (loading){
        return <p>loading goals...</p>;
    }
    if (error){
        return <p className="text-red-500">{error}</p>;
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

        <div className="mt-6 space-y-4">
            {goalPage.content.map((goal) => (
            <GoalCard
                key={goal.id}
                goal={goal}
            />
            ))}
        </div>

        <div className="mt-6 flex items-center gap-4">
            <button
                type="button"
                onClick={goToPreviousPage}
                disabled={page === 0}
                className="border p-2 disabled:opacity-50"
            >
                Previous
            </button>

            <span>
                Page {page + 1}
                {goalPage.totalPages > 0 &&
                    ` of ${goalPage.totalPages}`}
            </span>

            <button
                type="button"
                onClick={goToNextPage}
                disabled={goalPage.last}
                className="border p-2 disabled:opacity-50"
            >
                Next
            </button>
        </div>
    </div>
    );

}
export default Goals;
