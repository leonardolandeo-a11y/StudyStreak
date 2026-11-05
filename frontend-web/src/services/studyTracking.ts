import { createStudyOutbox } from "./studyOutbox";
import apiClient from "./apiClient";
import type { CompletedFocusSession } from "../components/dashboard/pomodoroState";

import type { TrackedSession } from "./studyTrackingState";
export { recoverTrackedTimer, mergePending } from "./studyTrackingState";
export const studyTracking = {
  async start(session: CompletedFocusSession) {
    await apiClient.post('/api/study/sessions', { sessionId: session.sessionId, goalId: session.goalId, minutes: session.durationMinutes });
  },
  async pulse(id: string, action: 'PULSE' | 'PAUSE' | 'RESUME' | 'CANCEL') {
    await apiClient.post(`/api/study/sessions/${id}`, { action });
  },
  async recover(): Promise<{ session: TrackedSession | null; serverNow: string }> { return (await apiClient.get('/api/study/active')).data; },
};


const outbox = createStudyOutbox({
  async keys() { return Object.keys(localStorage); },
  async read(key) { return localStorage.getItem(key); },
  async write(key, value) { localStorage.setItem(key, value); },
  async remove(key) { localStorage.removeItem(key); },
});
export const readPending = outbox.read;
export const savePending = outbox.save;
export const removePending = outbox.remove;
