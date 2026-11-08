import './helpers/appearanceTestLoader.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import { AxiosError } from 'axios';
process.env.EXPO_PUBLIC_API_URL = 'https://focus-fixture.invalid';
const { apiClient } = await import('../src/services/apiClient.ts');
const { studyTracking, savePending, readPending, removePending, recoverTrackedTimer } = await import('../src/services/studyTracking.ts');
const { recordMobileFocusCompletion } = await import('../src/features/focus/focusGoalService.ts');
const { newPomodoro, restorePomodoro } = await import('../src/features/focus/pomodoroState.ts');

test('actual native outbox retains an unobserved completion and retries a lost acknowledgment with the same UUID', async () => {
  const item = { sessionId: 'a963d0e1-a442-4c37-909f-a0415b903212', goalId: 7, durationMinutes: 5 };
  const counted = new Set(); let attempts = 0; const requests = [];
  apiClient.defaults.adapter = async config => {
    const body = config.data ? JSON.parse(config.data) : null; requests.push({ path: config.url, body });
    const response = { data: {}, status: 200, statusText: 'OK', config, headers: {} };
    if (config.url === '/api/goals/7/focus-sessions') {
      attempts++;
      assert.deepEqual(body, { sessionId: item.sessionId, durationMinutes: 5 });
      if (attempts === 1) throw new AxiosError('Unobserved time fixture', 'ERR_BAD_REQUEST', config, undefined, { ...response, status: 400 });
      counted.add(body.sessionId);
      if (attempts === 2) throw new AxiosError('Lost acknowledgment fixture', 'ERR_NETWORK', config);
    }
    return response;
  };
  await studyTracking.start(item);
  await studyTracking.pulse(item.sessionId, 'PAUSE');
  const restored = recoverTrackedTimer(newPomodoro(), { id: item.sessionId, goal_id: 7, planned_seconds: 300,
    observed_ms: 60000, state: 'PAUSED', ends_at: null }, '2026-11-08T00:00:00Z', 9999999999);
  assert.equal(restored.remainingMs, 240000); assert.equal(restored.activeFocusSession.sessionId, item.sessionId);
  assert.equal(restorePomodoro(JSON.parse(JSON.stringify(restored)), 99999999999).remainingMs, 240000);
  await savePending(1, item); await savePending(2, item);
  await assert.rejects(recordMobileFocusCompletion(item)); assert.deepEqual(await readPending(1), [item]);
  await assert.rejects(recordMobileFocusCompletion(item)); assert.deepEqual(await readPending(1), [item]);
  await recordMobileFocusCompletion((await readPending(1))[0]); await removePending(1, item.sessionId);
  assert.equal(counted.size, 1); assert.deepEqual(await readPending(1), []); assert.deepEqual(await readPending(2), [item]);
  assert.deepEqual(requests[0].body, { sessionId: item.sessionId, goalId: 7, minutes: 5 });
  await removePending(2, item.sessionId);
});
