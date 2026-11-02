import { apiClient } from './apiClient';

function voicePath(goalId: number, recordId: number): string {
  return `/api/goals/${goalId}/daily-records/${recordId}/voice`;
}

export const voiceEvidenceService = {
  async upload(goalId: number, recordId: number, uri: string): Promise<void> {
    const form = new FormData();
    form.append('audio', { uri, name: `study-note-${recordId}.m4a`, type: 'audio/mp4' } as unknown as Blob);
    await apiClient.post(voicePath(goalId, recordId), form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });
  },
  async remove(goalId: number, recordId: number): Promise<void> {
    await apiClient.delete(voicePath(goalId, recordId));
  },
  url(goalId: number, recordId: number): string {
    const base = apiClient.defaults.baseURL;
    if (!base) throw new Error('API URL is missing.');
    return `${base}${voicePath(goalId, recordId)}`;
  },
};
