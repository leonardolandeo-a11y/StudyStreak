import type { Soundscape } from "./pomodoroState";
import { makeNoise } from "./noiseSynthesis";
import type { NoiseColor } from "./noiseSynthesis";

type Cue = "start" | "pause" | "complete";

const CHORDS = {
    dream: [
        [57, 60, 64, 69], [53, 57, 60, 65], [60, 64, 67, 72], [55, 59, 62, 67]
    ],
    keys: [
        [60, 64, 67, 72], [57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67]
    ],
    classical: [
        [62, 65, 69, 74], [58, 62, 65, 70], [60, 64, 67, 72], [57, 60, 64, 69]
    ],
    lofi: [
        [60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65]
    ]
} as const;

type MusicStyle = keyof typeof CHORDS;
type AtmosphericStyle = Exclude<Soundscape, MusicStyle>;
type NoiseNode = { source: AudioBufferSourceNode; nodes: AudioNode[] };

/** Original generative music, noise and environmental atmospheres. No network requests. */
export class PomodoroAudio {
    private context: AudioContext | null = null;
    private master: GainNode | null = null;
    private atmosphere: NoiseNode | null = null;
    private beatTimer: number | null = null;
    private generation = 0;
    private disposed = false;

    private async getContext(): Promise<AudioContext | null> {
        if (this.disposed || typeof window === "undefined" || !window.AudioContext) return null;
        if (!this.context || this.context.state === "closed") {
            this.context = new window.AudioContext();
        }
        try {
            if (this.context.state === "suspended") await this.context.resume();
            return this.context.state === "running" ? this.context : null;
        } catch {
            return null;
        }
    }

    private static pitch(midi: number): number {
        return 440 * Math.pow(2, (midi - 69) / 12);
    }

    private tone(
        context: AudioContext, destination: AudioNode,
        midi: number, at: number, duration: number,
        level: number, wave: OscillatorType = "sine"
    ): void {
        const sound = context.createOscillator();
        const envelope = context.createGain();
        sound.type = wave;
        sound.frequency.setValueAtTime(PomodoroAudio.pitch(midi), at);
        envelope.gain.setValueAtTime(0.0001, at);
        envelope.gain.linearRampToValueAtTime(level, at + Math.min(0.07, duration / 5));
        envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
        sound.connect(envelope);
        envelope.connect(destination);
        sound.start(at);
        sound.stop(at + duration + 0.03);
        sound.onended = () => {
            sound.disconnect();
            envelope.disconnect();
        };
    }

    private chirp(context: AudioContext, destination: AudioNode, at: number, start: number, end: number, level: number): void {
        const oscillator = context.createOscillator();
        const envelope = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(start, at);
        oscillator.frequency.exponentialRampToValueAtTime(end, at + 0.15);
        envelope.gain.setValueAtTime(0.0001, at);
        envelope.gain.exponentialRampToValueAtTime(level, at + 0.02);
        envelope.gain.exponentialRampToValueAtTime(0.0001, at + 0.20);
        oscillator.connect(envelope);
        envelope.connect(destination);
        oscillator.start(at);
        oscillator.stop(at + 0.22);
        oscillator.onended = () => {
            oscillator.disconnect();
            envelope.disconnect();
        };
    }

    private loopNoise(context: AudioContext, output: GainNode, color: NoiseColor, style: AtmosphericStyle): void {
        const buffer = context.createBuffer(1, Math.round(context.sampleRate * 10), context.sampleRate);
        buffer.getChannelData(0).set(makeNoise(color, buffer.length));
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        const filter = context.createBiquadFilter();
        filter.type = style === "white" ? "lowpass" : style === "rain" ? "bandpass" : "lowpass";
        filter.frequency.value =
            style === "white" ? 6200 : style === "rain" ? 1450 :
            style === "forest" ? 900 : style === "cafe" ? 700 :
            style === "fireplace" ? 1200 : style === "ocean" ? 1150 : 2500;
        if (style === "rain") filter.Q.value = 0.35;
        const layer = context.createGain();
        layer.gain.value = style === "white" ? 0.50 : style === "rain" ? 0.85 :
            style === "brown" ? 0.82 : style === "pink" ? 0.86 :
            style === "cafe" ? 0.47 : style === "forest" ? 0.7 : 0.78;
        source.connect(filter);
        filter.connect(layer);
        layer.connect(output);
        const nodes: AudioNode[] = [filter, layer];

        if (style === "ocean") {
            const tide = context.createOscillator();
            const depth = context.createGain();
            tide.type = "sine";
            tide.frequency.value = 0.12;
            depth.gain.value = 0.33;
            layer.gain.value = 0.53;
            tide.connect(depth);
            depth.connect(layer.gain);
            tide.start();
            nodes.push(tide, depth);
        }
        source.start();
        this.atmosphere = { source, nodes };
    }

    private scheduleMusic(context: AudioContext, bus: GainNode, style: MusicStyle, token: number): void {
        const chords = CHORDS[style];
        const beatLength = style === "lofi" ? 0.55 : style === "classical" ? 0.80 : style === "dream" ? 0.88 : 0.73;
        const stepsPerChord = 8;
        let beat = 0;
        let next = context.currentTime + 0.09;

        const playBeat = (at: number) => {
            const chord = chords[Math.floor(beat / stepsPerChord) % chords.length];
            const step = beat % stepsPerChord;

            if (style === "dream") {
                if (step === 0) {
                    for (const midi of chord.slice(0, 3)) {
                        this.tone(context, bus, midi - 12, at, beatLength * 7.8, 0.045);
                    }
                }
                if (step % 2 === 0) this.tone(context, bus, chord[(step / 2) % 4] + 12, at, beatLength * 2.8, 0.045);
            } else if (style === "keys") {
                if (step === 0) this.tone(context, bus, chord[0] - 12, at, beatLength * 6, 0.032);
                const pattern = [0, 2, 1, 3, 2, 1, 3, 1];
                this.tone(context, bus, chord[pattern[step]] + 12, at, beatLength * 1.65, 0.09, "triangle");
            } else if (style === "classical") {
                // Newly written chamber-style arpeggios; not a sampled classical performance.
                if (step === 0 || step === 4) this.tone(context, bus, chord[0] - 12, at, beatLength * 3.6, 0.048, "triangle");
                const flowing = [0, 1, 2, 3, 2, 1, 3, 2];
                this.tone(context, bus, chord[flowing[step]] + 12, at, beatLength * 1.45, 0.080, "triangle");
                if (step % 4 === 0) {
                    this.tone(context, bus, chord[2], at, beatLength * 3.0, 0.022);
                }
            } else {
                // Original lo-fi jazz-style loop: soft seventh chords, bass and a gentle beat.
                if (step === 0 || step === 4) {
                    for (const midi of chord) this.tone(context, bus, midi, at, beatLength * 3.6, 0.030, "triangle");
                }
                if (step === 0 || step === 4) this.tone(context, bus, chord[0] - 24, at, beatLength * 1.8, 0.095, "sine");
                if (step === 2 || step === 6) this.tone(context, bus, 44, at, 0.085, 0.035, "triangle");
                if (step % 2 === 1) this.tone(context, bus, 82, at, 0.055, 0.014, "triangle");
                if (step === 3) this.tone(context, bus, chord[2] + 12, at, beatLength * 1.8, 0.045, "triangle");
            }
            beat++;
        };

        const schedule = () => {
            if (this.disposed || token !== this.generation || !this.master) return;
            // Cap scheduling after a background tab wakes, preventing large bursts.
            if (next < context.currentTime - beatLength) next = context.currentTime + 0.025;
            while (next < context.currentTime + 0.35) {
                playBeat(next);
                next += beatLength;
            }
        };
        schedule();
        this.beatTimer = window.setInterval(schedule, 180);
    }

    private scheduleAmbience(context: AudioContext, bus: GainNode, style: AtmosphericStyle, token: number): void {
        if (!["forest", "cafe", "fireplace"].includes(style)) return;
        let next = context.currentTime + 0.8;
        let count = 0;
        const schedule = () => {
            if (this.disposed || token !== this.generation || !this.master) return;
            if (next < context.currentTime - 1) next = context.currentTime + 0.2;
            while (next < context.currentTime + 0.5) {
                if (style === "forest") {
                    this.chirp(context, bus, next, 950 + (count % 4) * 140,
                        1450 + (count % 3) * 120, 0.025);
                } else if (style === "cafe") {
                    // Tiny ceramic-like taps, without recorded people or spoken words.
                    this.chirp(context, bus, next, 1050 + (count % 4) * 150,
                        740 + (count % 3) * 80, 0.018);
                } else {
                    this.chirp(context, bus, next, 400 + (count % 5) * 85,
                        210 + (count % 4) * 55, 0.030);
                }
                count++;
                next += style === "forest" ? 3.8 + (count % 3) * 1.2 :
                    style === "cafe" ? 5.5 + (count % 4) * 1.4 :
                    0.85 + (count % 3) * 0.32;
            }
        };
        schedule();
        this.beatTimer = window.setInterval(schedule, 250);
    }

    stop(): void {
        this.generation++;
        if (this.beatTimer !== null) window.clearInterval(this.beatTimer);
        this.beatTimer = null;
        if (this.atmosphere) {
            try { this.atmosphere.source.stop(); } catch { /* already stopped */ }
            this.atmosphere.source.disconnect();
            for (const node of this.atmosphere.nodes) {
                if (node instanceof OscillatorNode) {
                    try { node.stop(); } catch { /* already stopped */ }
                }
                node.disconnect();
            }
        }
        this.atmosphere = null;
        if (this.master && this.context && this.context.state !== "closed") {
            const previous = this.master;
            const current = this.context.currentTime;
            previous.gain.cancelScheduledValues(current);
            previous.gain.setTargetAtTime(0.0001, current, 0.045);
            window.setTimeout(() => previous.disconnect(), 400);
        }
        this.master = null;
    }

    setVolume(value: number): void {
        if (!this.master || !this.context) return;
        this.master.gain.setTargetAtTime(Math.max(0, Math.min(1, value)) * 0.46,
            this.context.currentTime, 0.07);
    }

    async start(style: Soundscape, volume: number): Promise<boolean> {
        this.stop();
        const token = this.generation;
        const context = await this.getContext();
        if (!context || this.disposed || token !== this.generation) return false;
        const bus = context.createGain();
        bus.gain.setValueAtTime(0.0001, context.currentTime);
        bus.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)) * 0.46, context.currentTime, 0.15);
        bus.connect(context.destination);
        this.master = bus;

        if (style === "dream" || style === "keys" || style === "classical" || style === "lofi") {
            this.scheduleMusic(context, bus, style, token);
        } else {
            const color: NoiseColor = style === "white" ? "white" :
                style === "brown" || style === "ocean" || style === "fireplace" ? "brown" : "pink";
            this.loopNoise(context, bus, color, style);
            this.scheduleAmbience(context, bus, style, token);
        }
        return true;
    }

    async cue(kind: Cue, volume: number): Promise<void> {
        const context = await this.getContext();
        if (!context || this.disposed) return;
        const output = context.createGain();
        output.gain.value = Math.max(0, Math.min(1, volume)) * 0.4;
        output.connect(context.destination);
        const now = context.currentTime + 0.01;
        const tones = kind === "complete" ? [72, 76, 79, 84] :
            kind === "start" ? [64, 69] : [69, 64];
        const length = kind === "complete" ? 0.22 : 0.13;
        tones.forEach((midi, index) => this.tone(context, output, midi,
            now + index * length, length * 1.5, 0.17));
        window.setTimeout(() => output.disconnect(), (tones.length + 2) * length * 1000);
    }

    dispose(): void {
        this.disposed = true;
        this.stop();
        void this.context?.close().catch(() => {});
        this.context = null;
    }
}
