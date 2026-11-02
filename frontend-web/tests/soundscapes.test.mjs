import test from 'node:test';
import assert from 'node:assert/strict';
import { SOUNDSCAPES, SOUND_CATEGORIES, soundscapeById } from '../src/components/dashboard/soundscapes.ts';
import { normalizePreferences, newPomodoro, updatePomodoroPreferences } from '../src/components/dashboard/pomodoroState.ts';

test('the sound library has twelve distinct, categorized, original soundscapes', () => {
    assert.equal(SOUNDSCAPES.length, 12);
    const ids = SOUNDSCAPES.map(sound => sound.id);
    assert.equal(new Set(ids).size, 12);
    const categories = SOUND_CATEGORIES.map(category => category.id);
    assert.ok(SOUNDSCAPES.every(sound => categories.includes(sound.category)));
    assert.ok(SOUNDSCAPES.every(sound => Boolean(sound.title && sound.description && sound.gradient)));
    assert.deepEqual(["white", "pink", "brown"].every(sound => ids.includes(sound)), true);
    assert.deepEqual(["classical", "lofi", "forest", "ocean", "cafe", "fireplace"].every(sound => ids.includes(sound)), true);
});

test('every library soundscape survives preference normalization and restore', () => {
    for (const sound of SOUNDSCAPES) {
        assert.equal(normalizePreferences({ soundscape: sound.id }).soundscape, sound.id);
        const updated = updatePomodoroPreferences(newPomodoro(), { soundscape: sound.id });
        assert.equal(updated.preferences.soundscape, sound.id);
        assert.equal(updated.remainingMs, 25 * 60000);
        assert.equal(soundscapeById(sound.id).title, sound.title);
    }
    assert.equal(normalizePreferences({ soundscape: 'external-mp3' }).soundscape, 'dream');
});
