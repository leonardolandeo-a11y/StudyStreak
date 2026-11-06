import test from "node:test";
import assert from "node:assert/strict";
import {
    newPomodoro, startPomodoro, pausePomodoro,
    advancePomodoro, restorePomodoro, resetPomodoro,
    selectPomodoroMode, updatePomodoroPreferences,
    discardPendingFocusSession
} from "../src/features/focus/pomodoroState.ts";

const linked = {
    sessionId: "a963d0e1-a442-4c37-909f-a0415b903212",
    goalId: 42,
    durationMinutes: 25
};

test("completed focus sessions add exactly one queued goal completion", () => {
    const start = startPomodoro(newPomodoro(), 1000, linked);
    assert.deepEqual(start.activeFocusSession, linked);
    const end = advancePomodoro(start, 1000 + 25 * 60_000);
    assert.equal(end.mode, "shortBreak");
    assert.equal(end.focusSessions, 1);
    assert.deepEqual(end.pendingFocusSessions, [linked]);
    const unchanged = advancePomodoro(end, 200_000_000);
    assert.deepEqual(unchanged.pendingFocusSessions, [linked]);
    const synced = discardPendingFocusSession(end, linked.sessionId);
    assert.deepEqual(synced.pendingFocusSessions, []);
});

test("paused timer and browser restore preserve linked goal and UUID", () => {
    const start = startPomodoro(newPomodoro(), 1000, linked);
    const paused = pausePomodoro(start, 11_000);
    const restored = restorePomodoro(JSON.parse(JSON.stringify(paused)), 20_000);
    assert.deepEqual(restored.activeFocusSession, linked);
    assert.equal(restored.endsAt, null);
    const resumed = startPomodoro(restored, 30_000, {
        sessionId: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
        goalId: 99, durationMinutes: 30
    });
    assert.deepEqual(resumed.activeFocusSession, linked);
    const completed = advancePomodoro(resumed, resumed.endsAt);
    assert.deepEqual(completed.pendingFocusSessions, [linked]);
});

test("time elapsed while closed restores a queued linked completion", () => {
    const start = startPomodoro(newPomodoro(), 1000, linked);
    const restored = restorePomodoro(JSON.parse(JSON.stringify(start)), 90 * 60_000);
    assert.equal(restored.mode, "shortBreak");
    assert.deepEqual(restored.pendingFocusSessions, [linked]);
});

test("reset, phase switch, and duration updates discard unfinished goal attribution", () => {
    const start = startPomodoro(newPomodoro(), 1000, linked);
    assert.equal(resetPomodoro(start).activeFocusSession, null);
    assert.equal(selectPomodoroMode(start, "shortBreak").activeFocusSession, null);
    const paused = pausePomodoro(start, 11_000);
    assert.equal(updatePomodoroPreferences(paused, { focusMinutes: 45 }).activeFocusSession, null);
    const breakStart = startPomodoro(selectPomodoroMode(newPomodoro(), "shortBreak"), 1000, linked);
    assert.equal(advancePomodoro(breakStart, 6 * 60_000).pendingFocusSessions.length, 0);
});

test("old saved timer state and invalid pending payloads restore safely", () => {
    const oldTimer = newPomodoro();
    delete oldTimer.activeFocusSession;
    delete oldTimer.pendingFocusSessions;
    assert.deepEqual(restorePomodoro(oldTimer, 500).pendingFocusSessions, []);
    const invalid = restorePomodoro({
        ...newPomodoro(), pendingFocusSessions: [
            { sessionId: "not-a-uuid", goalId: 42, durationMinutes: 25 },
            { sessionId: linked.sessionId, goalId: -2, durationMinutes: 25 },
            linked
        ]
    }, 500);
    assert.deepEqual(invalid.pendingFocusSessions, [linked]);
});

test('restoring more than 100 offline sessions never silently drops completions', () => {
    const pending = Array.from({ length: 125 }, (_, i) => ({ ...linked,
        sessionId: `a963d0e1-a442-4c37-909f-${String(i).padStart(12, '0')}` }));
    assert.deepEqual(restorePomodoro({ ...newPomodoro(), pendingFocusSessions: pending }, 1000)
        .pendingFocusSessions, pending);
});
