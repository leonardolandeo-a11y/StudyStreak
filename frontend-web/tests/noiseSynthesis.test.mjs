import test from 'node:test';
import assert from 'node:assert/strict';
import { makeNoise } from '../src/components/dashboard/noiseSynthesis.ts';

function rng(seed) {
    let state = seed >>> 0;
    return () => {
        state = (1664525 * state + 1013904223) >>> 0;
        return state / 4294967296;
    };
}

test('white, pink and brown samples are finite, non-silent and within safe amplitude bounds', () => {
    for (const color of ['white', 'pink', 'brown']) {
        const generated = makeNoise(color, 48_000, rng(42));
        assert.equal(generated.length, 48_000);
        assert.ok(generated.every(v => Number.isFinite(v) && Math.abs(v) <= 1));
        assert.ok(generated.some(v => Math.abs(v) > 0.01));
        assert.ok(Math.abs(generated[0] - generated.at(-1)) < 0.01);
    }
});

test('noise colors produce different, reproducible outputs without requiring AudioContext', () => {
    const white = makeNoise('white', 10_000, rng(72));
    const pink = makeNoise('pink', 10_000, rng(72));
    const brown = makeNoise('brown', 10_000, rng(72));
    assert.deepEqual(white, makeNoise('white', 10_000, rng(72)));
    assert.notDeepEqual(white, pink);
    assert.notDeepEqual(pink, brown);
    assert.equal(makeNoise('white', 0).length, 0);
});
