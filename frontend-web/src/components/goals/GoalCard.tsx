import { Link } from 'react-router-dom';
import { AcademicSprite } from '../academic/AcademicSprite';
import type { Goal } from '../../types/goal';
import { ROUTES, goalDetailsPath } from '../../routes/paths';
export default function GoalCard({ goal }: { goal: Goal }) {
    return <article className="goal-workflow-card">
        <Link to={goalDetailsPath(goal.id)} className="goal-card-main" aria-label={`Open ${goal.topic}`}>
            <AcademicSprite name={goal.completed ? 'notebook' : 'books'} width={54}/>
            <div className="min-w-0 flex-1"><h2 className="break-words text-xl font-bold text-content">{goal.topic}</h2><span className={`goal-status ${goal.completed ? 'text-success bg-success-surface' : 'text-accent bg-accent-soft'}`}>{goal.completed ? 'Completed' : 'Active'}</span><p className="mt-2 text-xs text-content-muted">{goal.frequency} sessions/week · {goal.duration} min/session</p><p className="mt-2 text-sm text-content-secondary">{goal.completed ? 'Goal completed' : 'Explore progress & daily records'} <span aria-hidden="true">→</span></p></div>
        </Link>
        {!goal.completed && <div className="border-t border-outline px-4 py-2"><Link className="inline-flex min-h-11 items-center text-sm font-semibold text-accent" to={`${ROUTES.focusStudio}?goalId=${goal.id}`}>Focus on this Goal →</Link></div>}
    </article>;
}
