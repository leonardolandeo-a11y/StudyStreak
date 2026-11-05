import { createStudyOutbox } from "./studyOutbox";
import { Directory, File, Paths } from 'expo-file-system';
import { apiClient } from "./apiClient";
import type { CompletedFocusSession } from "../features/focus/pomodoroState";

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


// Documents storage is durable and is not constrained by SecureStore value size.
function directory() {
  const value = new Directory(Paths.document, 'study-outbox-v3');
  value.create({ idempotent: true, intermediates: true }); return value;
}
const outbox = createStudyOutbox({
  async keys() { return directory().list().filter(entry => entry instanceof File).map(entry => entry.name); },
  async read(key) { const file = new File(directory(), key); return file.exists ? file.text() : null; },
  async write(key, value) {
    const temporary = new File(directory(), `${key}.tmp`);
    temporary.create({ overwrite: true }); await temporary.write(value);
    await temporary.move(new File(directory(), key), { overwrite: true });
  },
  async remove(key) { const file = new File(directory(), key); if (file.exists) file.delete(); },
});
export const readPending = outbox.read;
export const savePending = outbox.save;
export const removePending = outbox.remove;
