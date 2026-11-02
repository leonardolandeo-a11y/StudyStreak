import type { Goal } from "../types/goal";
import { getGoals } from "./goalService";

/** Loads all pages so a goal beyond the first page is not hidden from Focus Studio. */
export async function getAllActiveGoals(
    userId: number, signal?: AbortSignal
): Promise<Goal[]> {
    const result: Goal[] = [];
    let page = 0;
    while (true) {
        const response = await getGoals(userId, page, 100, signal);
        result.push(...response.content.filter(goal => !goal.completed));
        page++;
        if (response.last || page >= response.totalPages || response.content.length === 0) {
            break;
        }
    }
    return result;
}
