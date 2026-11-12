import { DifficultyBadge } from '../components/goals/GoalDifficulty';
import { AcademicSprite } from "../components/academic/AcademicSprite";
import { WorkflowDialog } from "../components/workflows/WorkflowDialog";
import { GoalTags } from "../components/goals/GoalTags";
import { getDailyRecords } from "../services/dailyRecordService";
import { RecordedSummary } from "../components/study/RecordedSummary";
import { useState,useEffect } from "react";
import { Link,useParams, useNavigate } from "react-router-dom";


import { useAuth } from "../hooks/useAuth";
import { getGoal ,updateGoal,deleteGoal} from "../services/goalService";

import GoalForm from "../components/goals/GoalForm";

import type { Goal,GoalRequest } from "../types/goal";

import {
    ROUTES,
    dailyRecordsPath,
    resourcesPath
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

import { useToast } from "../hooks/useToast";
import { useConfirm } from "../hooks/useConfirm";
import { getApiErrorMessage } from "../utils/apiError";
import { getFocusSummary } from "../services/focusSessionService";
import type { FocusSummary } from "../services/focusSessionService";

function GoalDetails(){
    const {currentUser} = useAuth();
    const {goalId} = useParams();
    const { showToast } = useToast();
    const [goal,setGoal]= useState<Goal|null>(null);
    const [loading, setLoading] = useState(true);
    const [error,setError] = useState<string|null>(null);

    const [editing, setEditing] = useState(false);
    const [recordCount, setRecordCount] = useState<number | null>(null);
    const [updating,setUpdating] = useState(false);

    const navigate = useNavigate();
    const [deleting, setDeleting] = useState(false);
    const [streak, setStreak] = useState<Streak | null>(null);

    const [streakLoading, setStreakLoading] =useState(true);

    const [streakError, setStreakError] = useState<string | null>(null);
    const [summaryRevision, setSummaryRevision] = useState(0);
    const [focusSummaryError, setFocusSummaryError] = useState(false);
    const [focusSummary, setFocusSummary] = useState<FocusSummary | null>(null);
    const userId = currentUser?.id;
    const parsedGoalId = goalId ? Number(goalId): null;
    const invalidGoalId= parsedGoalId=== null || !Number.isSafeInteger(parsedGoalId) || parsedGoalId<= 0;
    const confirm = useConfirm();
    async function handleUpdateGoal(updateData: GoalRequest): Promise<boolean> {
        if (!currentUser || !goal || updating) return false;
        setUpdating(true);
        setError(null);
        try {
            const updatedGoal = await updateGoal(currentUser.id, goal.id, updateData);
            setGoal(updatedGoal);
            showToast("Goal updated successfully.", "success");
            return true;
        } catch (cause) {
            showToast(getApiErrorMessage(cause, "Could not update goal."), "error");
            return false;
        } finally {
            setUpdating(false);
        }
    }
    async function handleDeleteGoal(){
        if (!currentUser || !goal){
            return;
        }
        const confirmed =
            await confirm({
                title: "Delete goal?",
                message:
                    `Are you sure you want to delete "${goal.topic}"? This action cannot be undone.`,
                confirmLabel: "Delete",
                cancelLabel: "Cancel",
                variant: "danger"
            });

        if (!confirmed) {
            return;
        }
        try{
            setDeleting(true);
            setError(null);

            await deleteGoal(currentUser.id, goal.id);
            showToast(
                "Goal deleted successfully.",
                "success"
            );
            navigate(ROUTES.goals);
        }catch{
            showToast(
                "Could not delete goal.",
                "error"
            );
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
    useEffect(() => {
        if (parsedGoalId === null || invalidGoalId || userId === null || userId === undefined) return;
        const controller = new AbortController();
        let sending = false;
        const refresh = async () => {
            if (sending || document.visibilityState !== "visible") return;
            sending = true;
            try {
                const result = await getFocusSummary(parsedGoalId, controller.signal);
                if (!controller.signal.aborted) { setFocusSummary(result); setFocusSummaryError(false); }
            } catch { if (!controller.signal.aborted) setFocusSummaryError(true); }
            finally { sending = false; }
        };
        void refresh();
        const interval = window.setInterval(() => { void refresh(); }, 30000);
        window.addEventListener("focus", refresh);
        document.addEventListener("visibilitychange", refresh);
        return () => { controller.abort(); window.clearInterval(interval); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
    }, [parsedGoalId, invalidGoalId, userId, summaryRevision]);

    useEffect(() => {
        if (!parsedGoalId || invalidGoalId || !userId) return;
        const controller = new AbortController();
        void getDailyRecords(parsedGoalId, 0, 1, controller.signal).then(data => { if (!controller.signal.aborted) setRecordCount(data.totalElements); }).catch(() => { if (!controller.signal.aborted) setRecordCount(null); });
        return () => controller.abort();
    }, [parsedGoalId, invalidGoalId, userId]);
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
    return <div className="academic-page academic-module goal-workflows space-y-5">
        <section className="study-panel goal-detail-hero">
            <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs text-content-muted">GOAL DETAILS</p><h1 className="mt-1 break-words text-2xl font-bold">{goal.topic}</h1></div><DifficultyBadge value={goal.difficulty}/></div>
            <span className={`goal-status ${goal.completed ? 'text-success bg-success-surface' : 'text-accent bg-accent-soft'}`}>{goal.completed ? 'Completed' : 'Active'}</span>
            <p className="mt-3 text-sm text-content-muted">{goal.frequency} sessions/week · {goal.duration} min/session</p>
            <div className="mt-4 flex flex-wrap gap-2"><button type="button" className="study-button" onClick={() => setEditing(true)}>Update Goal</button>
                {!goal.completed && <Link className="study-button bg-accent text-on-accent" to={`${ROUTES.focusStudio}?goalId=${goal.id}`}>Study this Goal</Link>}
                <Link className="study-button" to={resourcesPath(goal.topic)}>Find books for this goal</Link><Link className="study-button" to={ROUTES.studyRooms}>Study Rooms</Link>
            </div>
        </section>
        <div className="grid gap-4 lg:grid-cols-2"><RecordedSummary compact minutes={focusSummary?.goalId === goal.id ? focusSummary.totalMinutes : undefined} sessions={focusSummary?.goalId === goal.id ? focusSummary.completedSessions : undefined} error={focusSummaryError} onRefresh={() => setSummaryRevision(value => value + 1)}/>
            <Link to={dailyRecordsPath(goal.id)} className="study-panel flex items-center gap-4 p-4"><AcademicSprite name="notebook" width={36}/><div><p className="text-5xl font-bold tabular-nums">{recordCount ?? '—'}</p><h2 className="mt-1 font-semibold">Daily Records</h2><p className="text-sm text-content-muted">Explore notes & evidence →</p></div></Link>
        </div>
        <p className="text-xs text-content-muted">Saved focus sessions and Daily Records are tracked separately. Targets are your plan, not a completion percentage.</p>
        <GoalTags key={goal.id} userId={currentUser.id} goalId={goal.id}/>
        {streakLoading && <LoadingState message="Loading streak..."/>}{streakError && <ErrorMessage message={streakError}/>}{!streakLoading && !streakError && streak && <StreakCard streak={streak}/>}
        {editing && <WorkflowDialog title="Update Goal" busy={updating} onClose={() => setEditing(false)}><GoalForm initialValues={goal} onSubmit={async value => { const saved = await handleUpdateGoal(value); if (saved) setEditing(false); return saved; }} loading={updating} submitLabel="Update Goal" resetAfterSubmit={false} onCancel={() => setEditing(false)}/></WorkflowDialog>}
        <button type="button" className="study-button text-danger border-danger-outline" disabled={deleting} onClick={handleDeleteGoal}>{deleting ? 'Deleting...' : 'Delete Goal'}</button>
    </div>;
}
export default GoalDetails;
