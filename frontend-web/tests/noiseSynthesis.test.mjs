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


test('every color closes the loop exactly, including short buffers and multiple seeds', () => {
    for (const color of ['white', 'pink', 'brown']) for (const length of [0, 1, 2, 3, 5, 6, 9, 100, 48000, 192000]) {
        for (const seed of [1, 42, 991]) {
            const samples = makeNoise(color, length, rng(seed));
            assert.equal(samples.length, length);
            assert.ok(samples.every(Number.isFinite));
            if (length) assert.equal(samples[0], samples.at(-1));
        }
    }
});

test('crossfade preserves the unblended white-noise interior and uses bounded smooth weights', () => {
    const length = 48000, blend = 4096, random = rng(42);
    const raw = Float32Array.from({ length }, () => (2 * random() - 1) * 0.28);
    const loop = makeNoise('white', length, rng(42));
    assert.deepEqual(loop.slice(0, length - blend + 1), raw.slice(0, length - blend + 1));
    for (let i = 0; i < blend; i++) {
        const weight = (1 - Math.cos(Math.PI * i / (blend - 1))) / 2;
        const expected = Math.fround(raw[length - blend + i] * (1 - weight) + raw[blend - 1 - i] * weight);
        assert.equal(loop[length - blend + i], expected);
    }
});

test('white remains weakly correlated while pink and brown retain their stronger low-frequency character', () => {
    function correlation(samples) {
        const mean = samples.reduce((sum, value) => sum + value, 0) / samples.length;
        let variance = 0, adjacent = 0;
        for (let i = 1; i < samples.length; i++) {
            variance += (samples[i] - mean) ** 2;
            adjacent += (samples[i] - mean) * (samples[i - 1] - mean);
        }
        return adjacent / variance;
    }
    const [white, pink, brown] = ['white', 'pink', 'brown'].map(color => correlation(makeNoise(color, 48000, rng(42))));
    assert.ok(Math.abs(white) < 0.1);
    assert.ok(pink > white + 0.3);
    assert.ok(brown > pink);
});
