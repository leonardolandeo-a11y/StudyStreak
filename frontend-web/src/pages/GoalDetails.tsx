import { useState,useEffect } from "react";
import { Link,useParams, useNavigate } from "react-router-dom";


import { useAuth } from "../hooks/useAuth";
import { getGoal ,updateGoal,deleteGoal} from "../services/goalService";

import GoalForm from "../components/goals/GoalForm";

import type { Goal,GoalRequest } from "../types/goal";


function GoalDetails(){
    const {currentUser} = useAuth();
    const {goalId} = useParams();

    const [goal,setGoal]= useState<Goal|null>(null);
    const [loading, setLoading] = useState(true);
    const [error,setError] = useState<string|null>(null);

    const [updating,setUpdating] = useState(false);
    const [success, setSuccess] = useState<string |null>(null);

    const navigate = useNavigate();
    const [deleting, setDeleting] = useState(false);

    const userId = currentUser?.id;
    const parsedGoalId = goalId ? Number(goalId): null;
    const invalidGoalId= parsedGoalId=== null || !Number.isSafeInteger(parsedGoalId) || parsedGoalId<= 0;

    async function handleUpdateGoal(updateData: GoalRequest){
        if (!currentUser|| !goal){
            return;
        }
        try{
            setUpdating(true);
            setError(null);
            setSuccess(null);
            const updatedGoal = await updateGoal(currentUser.id, goal.id,updateData);
            setGoal(updatedGoal);
            setSuccess("Goal updated successfully.");
        }catch{
            setError("Could not update goal.")
        }finally{
            setUpdating(false);
        }
    }
    async function handleDeleteGoal(){
        if (!currentUser || !goal){
            return;
        }
        const confirmed = window.confirm(`Delete "${goal.topic}"?`);

        if (!confirmed){
            return;
        }
        try{
            setDeleting(true);
            setError(null);

            await deleteGoal(currentUser.id, goal.id);

            navigate("/goals");
        }catch{
            setError("Could not delete goal.")
        }finally{
            setDeleting(false);
        }
    }

    useEffect(() => {
        if (userId == null|| !Number.isSafeInteger(parsedGoalId)||parsedGoalId=== null || parsedGoalId<=0 ) {
            return;
        }

        let cancelled = false;

        async function loadGoal(id :number, goalNumber:number) {
            try {
                setLoading(true);
                setError(null);

                const response = await getGoal(id,goalNumber);

                if (!cancelled) {
                    setGoal(response);
                }
            } catch {
                if (!cancelled) {
                    setError("Could not load goal.");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        void loadGoal(userId,parsedGoalId);

        return () => {
            cancelled = true;
        };
    }, [userId, parsedGoalId]);

    if (!currentUser) {
        return <p>Please log in to view this goal.</p>;
    }

    if (invalidGoalId) {
        return <p>Invalid goal id.</p>;
    }
    if (loading){
        return <p>Loading goal...</p>;
    }
    if (error){
        return <p className="text-red-500">{error}</p>;
    }
    if (!goal){
        return <p>Goal not found.</p>
    }
    return (
    <div className="p-6">
        <h1 className="text-3xl font-bold">
            {goal.topic}
        </h1>

        <div className="mt-4 space-y-2">
            <p>Frequency: {goal.frequency}</p>
            <p>Duration: {goal.duration}</p>
            <p>
            Completed: {goal.completed ? "Yes" : "No"}
            </p>
        </div>

        <Link
            to={`/goals/${goal.id}/daily-records`}
            className="inline-block mt-4 underline"
        >
            View Daily Records
        </Link>

        {success && (
            <p className="mt-4 text-green-500">
            {success}
            </p>
        )}

        <div className="mt-6">
            <GoalForm
            onSubmit={handleUpdateGoal}
            loading={updating}
            initialValues={{
                topic: goal.topic,
                frequency: goal.frequency,
                duration: goal.duration,
                completed: goal.completed,
            }}
            submitLabel="Update Goal"
            resetAfterSubmit={false}
            />
        </div>

        <button
            type="button"
            onClick={handleDeleteGoal}
            disabled={deleting}
            className="mt-6 border p-2 text-red-500"
        >
            {deleting ? "Deleting..." : "Delete Goal"}
        </button>
    </div>
);
}
export default GoalDetails;