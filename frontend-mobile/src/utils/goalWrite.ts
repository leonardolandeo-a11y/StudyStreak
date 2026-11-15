import type { Goal, GoalRequest } from '../types/goal';

const levels = ['TRIVIAL', 'EASY', 'INTERMEDIATE', 'HARD'];
export function validateGoalDifficulty(goal: Goal): Goal {
    if (goal.difficulty != null && !levels.includes(goal.difficulty)) {
        throw new Error('The server returned an unsupported goal difficulty.');
    }
    return goal;
}

/** A 2xx can mean a partial write by an older server; never blindly repeat a POST. */
export class GoalWriteUnconfirmedError extends Error {
    readonly goalId: number | null;
    constructor(goalId: number | null) {
        super('Difficulty was not confirmed. Other fields may have been saved. Review the goal before retrying.');
        this.name = 'GoalWriteUnconfirmedError';
        this.goalId = goalId;
    }
}

export async function confirmGoalWrite(saved: Goal, request: GoalRequest, read: (id: number) => Promise<Goal>): Promise<Goal> {
    if (!request.difficulty) return validateGoalDifficulty(saved);
    const id = Number.isSafeInteger(saved?.id) && saved.id > 0 ? saved.id : null;
    if (id === null) throw new GoalWriteUnconfirmedError(null);
    try {
        // Confirm the authoritative read, never merge the requested field into the response.
        const persisted = validateGoalDifficulty(await read(id));
        if (persisted.id !== id || persisted.difficulty !== request.difficulty) throw new GoalWriteUnconfirmedError(id);
        return persisted;
    } catch {
        throw new GoalWriteUnconfirmedError(id);
    }
}
