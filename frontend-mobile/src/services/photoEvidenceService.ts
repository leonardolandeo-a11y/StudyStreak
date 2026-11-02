import { apiClient } from './apiClient';

function photoPath(goalId: number, recordId: number): string {
  return `/api/goals/${goalId}/daily-records/${recordId}/photo`;
}

export const photoEvidenceService = {
  async upload(goalId: number, recordId: number, uri: string): Promise<void> {
    const form = new FormData();
    form.append('photo', { uri, name: `evidence-${recordId}.jpg`, type: 'image/jpeg' } as unknown as Blob);
    await apiClient.post(photoPath(goalId, recordId), form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });
  },
  async remove(goalId: number, recordId: number): Promise<void> {
    await apiClient.delete(photoPath(goalId, recordId));
  },
  url(goalId: number, recordId: number): string {
    const base = apiClient.defaults.baseURL;
    if (!base) throw new Error('API URL is missing.');
    return `${base}${photoPath(goalId, recordId)}`;
  },
};
