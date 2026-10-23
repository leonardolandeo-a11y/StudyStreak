import { useState,useEffect } from "react";
import { Link,useParams, useNavigate } from "react-router-dom";


import { useAuth } from "../hooks/useAuth";
import { getGoal ,updateGoal,deleteGoal} from "../services/goalService";

import GoalForm from "../components/goals/GoalForm";

import type { Goal,GoalRequest } from "../types/goal";

import {
    ROUTES,
    dailyRecordsPath,
    tagsPath
} from "../routes/paths";

import {
    getGoalStreak
} from "../services/streakService";

import type {
    Streak
} from "../types/streak";

import StreakCard
    from "../components/streaks/StreakCard";

import LoadingState
    from "../components/ui/LoadingState";

import ErrorMessage
    from "../components/ui/ErrorMessage";

import EmptyState
    from "../components/ui/EmptyState";
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
    const [streak, setStreak] = useState<Streak | null>(null);

    const [streakLoading, setStreakLoading] =useState(true);

    const [streakError, setStreakError] = useState<string | null>(null);
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

            navigate(ROUTES.goals);
        }catch{
            setError("Could not delete goal.")
        }finally{
            setDeleting(false);
        }
    }
useEffect(() => {

        if (userId == null ||parsedGoalId === null || invalidGoalId) {
            return;
        }

        const controller =new AbortController();


        async function loadGoal(id: number,goalNumber: number) {

            try {

                setLoading(true);
                setError(null);

                const response =await getGoal(id, goalNumber,controller.signal );
                setGoal(response);

            } catch {

                if (!controller.signal.aborted) {
                    setError("Could not load goal.");
                }

            } finally {

                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }


        void loadGoal(userId,parsedGoalId);


        return () => {
            controller.abort();
        };

    }, [
        userId,
        parsedGoalId,
        invalidGoalId
    ]);
    useEffect(() => {
        if (userId == null ||parsedGoalId === null ||invalidGoalId) {
            return;
        }

        const controller =new AbortController();


        async function loadStreak(goalNumber: number) {

            try {

                setStreakLoading(true);
                setStreakError(null);

                const response = await getGoalStreak(goalNumber,controller.signal);
                setStreak(response);

            } catch {

                if (!controller.signal.aborted) {
                    setStreakError("Could not load streak.");
                }

            } finally {

                if (!controller.signal.aborted) {
                    setStreakLoading(false);
                }
            }
        }


        void loadStreak(parsedGoalId);


        return () => {
            controller.abort();
        };

    }, [
        userId,
        parsedGoalId,
        invalidGoalId
    ]);
    if (!currentUser) {
        return <p>Please log in to view this goal.</p>;
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
                message="Loading goal..."
            />
        );
    }

    if (error && !goal) {
        return (
            <ErrorMessage
                message={error}
            />
        );
    }

    if (!goal) {
        return (
            <EmptyState
                message="Goal not found."
            />
        );
    }
    return (
    <div className="space-y-8">

        <section
            className="
                rounded-2xl
                border border-slate-800
                bg-slate-900/70
                p-6
                shadow-lg shadow-black/10
            "
        >
            <div
                className="
                    flex flex-wrap
                    items-start
                    justify-between
                    gap-4
                "
            >
                <div>
                    <p className="text-sm font-medium text-sky-400">
                        Goal details
                    </p>

                    <h1
                        className="
                            mt-2
                            text-3xl font-bold
                            tracking-tight
                            text-slate-100
                        "
                    >
                        {goal.topic}
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Goal #{goal.id}
                    </p>
                </div>

                <span
                    className={`
                        rounded-full
                        px-3 py-1
                        text-xs font-semibold
                        ${
                            goal.completed
                                ? "bg-emerald-950/60 text-emerald-300"
                                : "bg-sky-950/60 text-sky-300"
                        }
                    `}
                >
                    {goal.completed ? "Completed" : "Active"}
                </span>
            </div>


            <div
                className="
                    mt-6
                    grid gap-4
                    sm:grid-cols-2
                "
            >
                <div
                    className="
                        rounded-xl
                        border border-slate-800
                        bg-slate-950/50
                        p-4
                    "
                >
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                        Frequency
                    </p>

                    <p className="mt-2 text-xl font-semibold text-slate-100">
                        {goal.frequency}
                    </p>
                </div>

                <div
                    className="
                        rounded-xl
                        border border-slate-800
                        bg-slate-950/50
                        p-4
                    "
                >
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                        Duration
                    </p>

                    <p className="mt-2 text-xl font-semibold text-slate-100">
                        {goal.duration}
                    </p>
                </div>
            </div>


            <div className="mt-6 flex flex-wrap gap-3">

                <Link
                    to={dailyRecordsPath(goal.id)}
                    className="
                        rounded-lg
                        bg-sky-500
                        px-4 py-2.5
                        text-sm font-semibold
                        text-slate-950
                        hover:bg-sky-400
                    "
                >
                    View Daily Records
                </Link>

                <Link
                    to={tagsPath(goal.id)}
                    className="
                        rounded-lg
                        border border-slate-700
                        bg-slate-950
                        px-4 py-2.5
                        text-sm font-medium
                        text-slate-200
                        hover:border-slate-600
                        hover:bg-slate-800
                    "
                >
                    Manage Tags
                </Link>

            </div>
        </section>


        <section>
            {streakLoading && (
                <LoadingState
                    message="Loading streak..."
                />
            )}

            {streakError && (
                <ErrorMessage
                    message={streakError}
                />
            )}

            {!streakLoading &&
                !streakError &&
                streak && (
                    <StreakCard
                        streak={streak}
                    />
                )}
        </section>


        {success && (
            <div
                className="
                    rounded-xl
                    border border-emerald-900/60
                    bg-emerald-950/40
                    px-4 py-3
                    text-sm text-emerald-300
                "
            >
                {success}
            </div>
        )}

        {error && goal && (
            <ErrorMessage
                message={error}
            />
        )}


        <section>
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
        </section>


        <section
            className="
                rounded-2xl
                border border-red-950
                bg-red-950/20
                p-6
            "
        >
            <h2 className="text-lg font-semibold text-red-300">
                Danger zone
            </h2>

            <p className="mt-1 text-sm text-slate-400">
                Deleting this goal cannot be undone.
            </p>

            <button
                type="button"
                onClick={handleDeleteGoal}
                disabled={deleting}
                className="
                    mt-4
                    rounded-lg
                    border border-red-900
                    bg-red-950/50
                    px-4 py-2.5
                    text-sm font-semibold
                    text-red-300
                    hover:bg-red-900/40
                    disabled:opacity-50
                "
            >
                {deleting
                    ? "Deleting..."
                    : "Delete Goal"}
            </button>
        </section>

    </div>
);
}
export default GoalDetails;