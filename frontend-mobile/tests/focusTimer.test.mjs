import assert from 'node:assert/strict';
import test from 'node:test';
import {
    newPomodoro, startPomodoro, pausePomodoro, advancePomodoro,
    selectPomodoroMode, resetPomodoro, updatePomodoroPreferences,
    restorePomodoro, remainingPomodoroMs, formatPomodoroTime
} from '../src/features/focus/pomodoroState.ts';

test('timer tracks elapsed wall time instead of depending on interval ticks', () => {
    const initial = newPomodoro();
    const running = startPomodoro(initial, 100_000);
    assert.equal(running.endsAt, 100_000 + 25 * 60_000);
    assert.equal(remainingPomodoroMs(running, 110_000), 25 * 60_000 - 10_000);
    assert.equal(formatPomodoroTime(remainingPomodoroMs(running, 110_000)), '24:50');
    assert.equal(startPomodoro(running, 120_000), running);
});

test('pause and resume preserve the precise remainder', () => {
    const running = startPomodoro(newPomodoro(), 500);
    const paused = pausePomodoro(running, 15_500);
    assert.equal(paused.endsAt, null);
    assert.equal(paused.remainingMs, 25 * 60_000 - 15_000);
    assert.equal(startPomodoro(paused, 20_000).endsAt, 20_000 + paused.remainingMs);
});

test('every fourth completed focus block leads to a long break', () => {
    let timer = newPomodoro();
    for (let i = 1; i <= 4; i++) {
        timer = advancePomodoro(startPomodoro(timer, 0), 25 * 60_000);
        assert.equal(timer.focusSessions, i);
        assert.equal(timer.mode, i === 4 ? 'longBreak' : 'shortBreak');
        timer = advancePomodoro(startPomodoro(timer, 0), timer.remainingMs);
        assert.equal(timer.mode, 'focus');
    }
});

test('select and reset change the phase without giving completed sessions', () => {
    const initial = newPomodoro();
    const short = selectPomodoroMode(startPomodoro(initial, 100), 'shortBreak');
    assert.equal(short.focusSessions, 0);
    assert.equal(short.endsAt, null);
    assert.equal(short.remainingMs, 5 * 60_000);
    const reset = resetPomodoro(pausePomodoro(startPomodoro(short, 500), 1000));
    assert.equal(reset.remainingMs, 5 * 60_000);
});

test('settings are normalized and cannot silently corrupt timer state', () => {
    const timer = updatePomodoroPreferences(newPomodoro(), {
        focusMinutes: 45, shortBreakMinutes: 0, volume: 9
    });
    assert.equal(timer.remainingMs, 45 * 60_000);
    assert.equal(timer.preferences.shortBreakMinutes, 1);
    assert.equal(timer.preferences.volume, 1);
    assert.equal(restorePomodoro({ mode: 'focus', remainingMs: -100, preferences: null }, 100).remainingMs, 0);
    assert.equal(restorePomodoro(null, 100).remainingMs, 25 * 60_000);
});

test('restoring a timer elapsed while the tab was closed completes only one phase', () => {
    const running = startPomodoro(newPomodoro(), 100);
    const restored = restorePomodoro(running, 100 + 60 * 60_000);
    assert.equal(restored.mode, 'shortBreak');
    assert.equal(restored.focusSessions, 1);
    assert.equal(restored.endsAt, null);
    assert.equal(restored.remainingMs, 5 * 60_000);
});

test('soundscape and volume changes do not reset active timers', () => {
    const running = startPomodoro(newPomodoro(), 500);
    const changed = updatePomodoroPreferences(running, { soundscape: 'rain', volume: 0.65 });
    assert.equal(changed.endsAt, running.endsAt);
    assert.equal(changed.remainingMs, running.remainingMs);
});
