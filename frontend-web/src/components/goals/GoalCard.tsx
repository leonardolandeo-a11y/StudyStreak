import { Link } from 'react-router-dom';
import { ChevronRight, Timer } from 'lucide-react';
import { DifficultyFace } from './GoalDifficulty';
import { GOAL_DIFFICULTY_LABELS, type Goal } from '../../types/goal';
import { ROUTES, goalDetailsPath } from '../../routes/paths';
export default function GoalCard({ goal }: { goal: Goal }) {
    return <article className="goal-compact-card">
        <Link to={goalDetailsPath(goal.id)} className="goal-compact-main" aria-label={`Open ${goal.topic}`}>
            <DifficultyFace value={goal.difficulty}/>
            <div className="goal-compact-identity">
                <h2 className="break-words text-base font-bold">{goal.topic}</h2>
                <p className="mt-1 text-xs text-content-muted">{goal.frequency} sessions/week · {goal.duration} min/session</p>
                <span className={`mt-1 inline-block text-xs font-medium ${goal.completed ? 'text-success' : 'text-content-secondary'}`}>{goal.completed ? 'Completed' : 'Active'} · {goal.difficulty ? GOAL_DIFFICULTY_LABELS[goal.difficulty] : 'Sin dificultad'}</span>
            </div>
            <ChevronRight size={16} className="mx-1 shrink-0 self-center text-content-muted" aria-hidden="true"/>
        </Link>
        {!goal.completed && <Link className="goal-compact-focus" aria-label={`Focus on ${goal.topic}`} title="Focus on this Goal"
            to={`${ROUTES.focusStudio}?goalId=${goal.id}`}><Timer size={18} aria-hidden="true"/></Link>}
    </article>;
}
