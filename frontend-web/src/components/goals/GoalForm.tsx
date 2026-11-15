import { useState, type SubmitEvent } from 'react';
import { DifficultySelector } from './GoalDifficulty';
import type { GoalDifficulty, GoalRequest } from '../../types/goal';
export default function GoalForm({ onSubmit, loading, initialValues, submitLabel = 'Create Goal', resetAfterSubmit = true, onCancel, blocked = false }: {
    blocked?: boolean; onSubmit(goal: GoalRequest): Promise<boolean>; loading: boolean; initialValues?: GoalRequest; submitLabel?: string; resetAfterSubmit?: boolean; onCancel?: () => void;
}) {
    const locked = loading || blocked;
    const [difficulty, setDifficulty] = useState<GoalDifficulty | undefined>(initialValues?.difficulty ?? undefined);
    const [topic, setTopic] = useState(initialValues?.topic ?? '');
    const [frequency, setFrequency] = useState(initialValues?.frequency ?? 1);
    const [duration, setDuration] = useState(initialValues?.duration ?? 30);
    const [completed, setCompleted] = useState(initialValues?.completed ?? false);
    const [error, setError] = useState<string | null>(null);
    async function submit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault(); if (locked) return;
        if (!topic.trim()) { setError('Topic is required.'); return; }
        if (!Number.isSafeInteger(frequency) || frequency <= 0) { setError('Frequency must be a positive integer.'); return; }
        if (!Number.isSafeInteger(duration) || duration <= 0) { setError('Duration must be a positive integer.'); return; }
        if (!initialValues && !difficulty) { setError('Select a difficulty.'); return; }
        setError(null);
        if (await onSubmit({ topic: topic.trim(), frequency, duration, completed: initialValues ? completed : false, ...(difficulty ? { difficulty } : {}) }) && resetAfterSubmit) { setTopic(''); setFrequency(1); setDuration(30); setCompleted(false); }
    }
    return <form onSubmit={submit} className="workflow-form space-y-4">
        <div><label htmlFor="topic">Topic</label><input id="topic" required value={topic} disabled={locked} onChange={e => setTopic(e.target.value)} placeholder="What would you like to study?"/></div>
        <fieldset className="grid gap-3 sm:grid-cols-2"><legend className="mb-2 text-sm font-semibold">Study schedule</legend>
            <div><label htmlFor="frequency">Frequency</label><input id="frequency" type="number" min="1" step="1" required value={frequency} disabled={locked} onChange={e => setFrequency(Number(e.target.value))}/><small>Sessions per week</small></div>
            <div><label htmlFor="duration">Duration</label><input id="duration" type="number" min="1" step="1" required value={duration} disabled={locked} onChange={e => setDuration(Number(e.target.value))}/><small>Minutes per session</small></div>
        </fieldset>
        <DifficultySelector value={difficulty} disabled={locked} required={!initialValues} onChange={setDifficulty}/>
        {initialValues ? <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={completed} disabled={locked} onChange={e => setCompleted(e.target.checked)}/>Completed</label> : <p className="text-xs text-content-muted">New goals start Active.</p>}
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <div className="flex flex-wrap gap-2"><button type="submit" className="study-button bg-accent text-on-accent" disabled={locked}>{loading ? 'Saving...' : submitLabel}</button>{onCancel && <button type="button" className="study-button" disabled={loading} onClick={onCancel}>Cancel</button>}</div>
    </form>;
}
