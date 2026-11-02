import type { Soundscape } from './pomodoroState';

const TAU = Math.PI * 2;
const SAMPLE_RATE = 22050;
const LOOP_SECONDS = 12;

type Cue = 'start' | 'pause' | 'complete';

function frequency(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

function sine(hz: number, t: number): number {
  return Math.sin(TAU * hz * t);
}

function hashNoise(index: number, salt = 0): number {
  let value = (index + salt * 7919 + 0x9e3779b9) | 0;
  value = Math.imul(value ^ (value >>> 16), 0x21f0aaad);
  value = Math.imul(value ^ (value >>> 15), 0x735a2d97);
  value = (value ^ (value >>> 15)) >>> 0;
  return value / 2147483648 - 1;
}

function musicalNote(note: number, elapsed: number, decay: number, attack = 0.012): number {
  if (elapsed < 0) return 0;
  const envelope = Math.min(1, elapsed / attack) * Math.exp(-elapsed / decay);
  const hz = frequency(note);
  return envelope * (sine(hz, elapsed) * 0.75 + sine(hz * 2, elapsed) * 0.20 +
    sine(hz * 3, elapsed) * 0.05);
}

function instrumental(style: Soundscape, t: number): number {
  const chords = [
    [57, 60, 64, 69],
    [53, 57, 60, 65],
    [60, 64, 67, 72],
    [55, 59, 62, 67],
  ];
  const chord = chords[Math.floor(t / 3) % chords.length];
  if (style === 'dream') {
    let value = 0;
    const envelope = 0.72 + 0.20 * sine(0.14, t);
    for (const midi of chord.slice(0, 3)) {
      value += sine(frequency(midi - 12), t) * 0.055;
      value += sine(frequency(midi - 12) * 1.004, t) * 0.022;
    }
    return value * envelope;
  }
  const beat = style === 'classical' ? 0.40 : style === 'lofi' ? 0.55 : 0.70;
  const step = Math.floor(t / beat);
  const elapsed = t - step * beat;
  const pattern = style === 'classical' ? [0, 1, 2, 3, 2, 1, 3, 1] :
    style === 'lofi' ? [0, 2, 1, 3, 2, 1, 3, 1] : [0, 2, 1, 3, 2, 1, 3, 1];
  let value = 0.19 * musicalNote(chord[pattern[step % 8]] + 12, elapsed, style === 'classical' ? 0.40 : 0.64);
  if (style === 'classical') {
    const bassStep = Math.floor(t / (beat * 4));
    const bassElapsed = t - bassStep * beat * 4;
    value += 0.08 * musicalNote(chord[0] - 12, bassElapsed, 1.3);
  } else if (style === 'lofi') {
    const kickPeriod = beat * 2;
    const kickElapsed = t % kickPeriod;
    const kick = Math.exp(-kickElapsed * 23) * sine(72 - kickElapsed * 25, kickElapsed);
    const snareElapsed = (t + beat) % kickPeriod;
    const snare = Math.exp(-snareElapsed * 35) * hashNoise(Math.floor(t * SAMPLE_RATE), 101);
    value += kick * 0.16 + snare * 0.03;
    value += 0.065 * musicalNote(chord[0] - 24, t % (beat * 4), 0.9);
  } else {
    value += 0.035 * musicalNote(chord[0] - 12, t % (beat * 4), 1.6);
  }
  return value;
}

function wav(samples: Float32Array, sampleRate: number): Uint8Array {
  const bytes = new Uint8Array(44 + samples.length * 2);
  const view = new DataView(bytes.buffer);
  const writeWord = (at: number, word: string) => {
    for (let i = 0; i < word.length; i++) view.setUint8(at + i, word.charCodeAt(i));
  };
  writeWord(0, 'RIFF');
  view.setUint32(4, bytes.length - 8, true);
  writeWord(8, 'WAVE');
  writeWord(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeWord(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    view.setInt16(44 + i * 2, Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), true);
  }
  return bytes;
}

/**
 * Self-contained synthesized WAV. No streaming, downloaded tracks or copyright assets.
 * Short loop and 250-ms taper avoid most audible seam clicks on mobile decoders.
 */
export function synthesizeStudySound(
  style: Soundscape, seconds = LOOP_SECONDS, sampleRate = SAMPLE_RATE
): Uint8Array {
  const frames = Math.max(1, Math.round(seconds * sampleRate));
  const samples = new Float32Array(frames);
  let pink0 = 0, pink1 = 0, pink2 = 0, pink3 = 0;
  let brown = 0, wind = 0;
  for (let i = 0; i < frames; i++) {
    const t = i / sampleRate;
    const white = hashNoise(i);
    pink0 = 0.997 * pink0 + white * 0.029;
    pink1 = 0.983 * pink1 + white * 0.049;
    pink2 = 0.891 * pink2 + white * 0.090;
    pink3 = 0.555 * pink3 + white * 0.19;
    const pink = (pink0 + pink1 + pink2 + pink3 + white * 0.11) * 0.63;
    brown = (brown + white * 0.026) / 1.026;
    wind = 0.9992 * wind + white * 0.0008;
    let value = 0;

    if (style === 'dream' || style === 'keys' || style === 'classical' || style === 'lofi') {
      value = instrumental(style, t);
    } else if (style === 'white') {
      value = white * 0.20;
    } else if (style === 'pink') {
      value = pink * 0.37;
    } else if (style === 'brown') {
      value = brown * 1.3;
    } else if (style === 'rain') {
      const pitter = 0.80 + 0.20 * sine(0.19, t);
      value = (0.22 * pink + 0.055 * white) * pitter;
    } else if (style === 'ocean') {
      const wave = 0.25 + 0.55 * Math.pow(0.5 + 0.5 * sine(0.105, t), 2);
      value = (pink * 0.28 + brown * 0.2) * wave;
    } else if (style === 'forest') {
      value = brown * 0.32 + wind * 0.20;
      const bird = t % 3.4;
      if (bird < 0.30) {
        const chirp = 930 + bird * 1400;
        value += 0.035 * Math.sin(TAU * (930 * bird + 700 * bird * bird)) *
          Math.sin(Math.PI * bird / 0.30);
        value += 0.012 * sine(chirp, t);
      }
    } else if (style === 'cafe') {
      value = pink * 0.12 + brown * 0.24;
      const cup = t % 4.2;
      if (cup < 0.13) value += sine(1300, cup) * Math.exp(-cup * 42) * 0.055;
    } else if (style === 'fireplace') {
      value = brown * 0.32 + pink * 0.09;
      const crackle = (t + 0.12) % 0.78;
      if (crackle < 0.06) value += hashNoise(i, 39) * Math.exp(-crackle * 65) * 0.09;
    }
    const fade = Math.min(1, i / (sampleRate * 0.25),
      (frames - 1 - i) / (sampleRate * 0.25));
    samples[i] = Math.max(-0.8, Math.min(0.8, value * Math.max(0, fade)));
  }
  return wav(samples, sampleRate);
}

export function synthesizeCue(kind: Cue, sampleRate = SAMPLE_RATE): Uint8Array {
  const notes = kind === 'complete' ? [72, 76, 79, 84] :
    kind === 'start' ? [64, 69] : [69, 64];
  const spacing = kind === 'complete' ? 0.18 : 0.13;
  const seconds = notes.length * spacing + 0.38;
  const frames = Math.round(seconds * sampleRate);
  const samples = new Float32Array(frames);
  for (let i = 0; i < frames; i++) {
    const t = i / sampleRate;
    let level = 0;
    for (let n = 0; n < notes.length; n++) {
      const dt = t - n * spacing;
      level += musicalNote(notes[n], dt, 0.16) * 0.17;
    }
    samples[i] = Math.max(-0.5, Math.min(0.5, level));
  }
  return wav(samples, sampleRate);
}
