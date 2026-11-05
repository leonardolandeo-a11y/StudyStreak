import type { PomodoroState, CompletedFocusSession } from "../components/dashboard/pomodoroState";
export interface TrackedSession { id: string; goal_id: number | null; original_goal_id?: number; planned_seconds: number; observed_ms: number; ends_at: string | null; state: string; }
export function recoverTrackedTimer(previous: PomodoroState, session: TrackedSession | null, serverNow: string, now = Date.now()): PomodoroState {
  if (!session || previous.pendingFocusSessions.some(item => item.sessionId === session.id)) return previous;
  const goalId = session.original_goal_id ?? session.goal_id;
  if (goalId == null) return previous;
  const remaining = session.ends_at ? Math.max(0, Date.parse(session.ends_at) - Date.parse(serverNow)) : Math.max(0, session.planned_seconds * 1000 - session.observed_ms);
  return { ...previous, mode: 'focus', preferences: { ...previous.preferences, focusMinutes: session.planned_seconds / 60 },
    activeFocusSession: { sessionId: session.id, goalId, durationMinutes: session.planned_seconds / 60 },
    remainingMs: remaining, endsAt: session.state === 'RUNNING' ? now + remaining : null };
}
export function mergePending(existing: CompletedFocusSession[], restored: CompletedFocusSession[]): CompletedFocusSession[] {
  return [...new Map([...existing, ...restored].map(item => [item.sessionId, item])).values()];
}
