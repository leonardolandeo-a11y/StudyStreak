import type { Soundscape } from "./pomodoroState";

type Cue = "start" | "pause" | "complete";

/**
 * Original, procedurally generated soundscapes and cues.
 * No remote audio, downloads, copyrighted tracks or API calls.
 */
export class PomodoroAudio {
    private context: AudioContext | null = null;
    private musicBus: GainNode | null = null;
    private rainSource: AudioBufferSourceNode | null = null;
    private interval: number | null = null;
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

    private static frequency(midi: number): number {
        return 440 * Math.pow(2, (midi - 69) / 12);
    }

    private note(
        context: AudioContext, output: AudioNode, midi: number,
        startAt: number, length: number, intensity: number,
        wave: OscillatorType = "sine"
    ): void {
        const oscillator = context.createOscillator();
        const envelope = context.createGain();
        oscillator.type = wave;
        oscillator.frequency.setValueAtTime(PomodoroAudio.frequency(midi), startAt);
        envelope.gain.setValueAtTime(0.0001, startAt);
        envelope.gain.linearRampToValueAtTime(intensity, startAt + Math.min(0.08, length / 4));
        envelope.gain.exponentialRampToValueAtTime(0.0001, startAt + length);
        oscillator.connect(envelope);
        envelope.connect(output);
        oscillator.start(startAt);
        oscillator.stop(startAt + length + 0.02);
        oscillator.onended = () => {
            oscillator.disconnect();
            envelope.disconnect();
        };
    }

    stop(): void {
        this.generation++;
        if (this.interval !== null) window.clearInterval(this.interval);
        this.interval = null;
        if (this.rainSource) {
            try { this.rainSource.stop(); } catch { /* already stopped */ }
            this.rainSource.disconnect();
        }
        this.rainSource = null;
        if (this.musicBus && this.context && this.context.state !== "closed") {
            const bus = this.musicBus;
            const t = this.context.currentTime;
            bus.gain.cancelScheduledValues(t);
            bus.gain.setTargetAtTime(0.0001, t, 0.03);
            window.setTimeout(() => bus.disconnect(), 350);
        }
        this.musicBus = null;
    }

    setVolume(value: number): void {
        if (!this.musicBus || !this.context) return;
        this.musicBus.gain.setTargetAtTime(Math.max(0, Math.min(1, value)) * 0.46,
            this.context.currentTime, 0.08);
    }

    async start(style: Soundscape, volume: number): Promise<boolean> {
        this.stop();
        const token = this.generation;
        const context = await this.getContext();
        if (!context || this.disposed || token !== this.generation) return false;

        const bus = context.createGain();
        bus.gain.setValueAtTime(0.0001, context.currentTime);
        bus.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)) * 0.46,
            context.currentTime, 0.12);
        bus.connect(context.destination);
        this.musicBus = bus;

        if (style === "rain") {
            // Short looping brown-noise buffer, filtered for a soft rain texture.
            const buffer = context.createBuffer(1, Math.round(context.sampleRate * 3), context.sampleRate);
            const data = buffer.getChannelData(0);
            let last = 0;
            for (let i = 0; i < data.length; i++) {
                const white = Math.random() * 2 - 1;
                last = (last + 0.025 * white) / 1.025;
                data[i] = Math.max(-1, Math.min(1, last * 3.5));
            }
            const noise = context.createBufferSource();
            const filter = context.createBiquadFilter();
            filter.type = "lowpass";
            filter.frequency.value = 1050;
            noise.buffer = buffer;
            noise.loop = true;
            noise.connect(filter);
            filter.connect(bus);
            noise.start();
            this.rainSource = noise;
            return true;
        }

        const chords = [
            [57, 60, 64, 69], // Am
            [53, 57, 60, 65], // F
            [60, 64, 67, 72], // C
            [55, 59, 62, 67]  // G
        ];
        // Original four-chord ambient pattern, no external media.
        const beatLength = style === "dream" ? 0.86 : 0.68;
        let beat = 0;
        let nextBeatAt = context.currentTime + 0.06;

        const schedule = () => {
            if (this.disposed || token !== this.generation || !this.musicBus) return;
            while (nextBeatAt < context.currentTime + 0.32) {
                const chord = chords[Math.floor(beat / 8) % chords.length];
                if (style === "dream") {
                    if (beat % 8 === 0) {
                        for (const midi of chord.slice(0, 3)) {
                            this.note(context, bus, midi - 12, nextBeatAt,
                                beatLength * 7.7, 0.065, "sine");
                        }
                    }
                    if (beat % 2 === 0) {
                        this.note(context, bus, chord[(beat / 2) % 4] + 12,
                            nextBeatAt, beatLength * 2.6, 0.06);
                    }
                } else {
                    if (beat % 8 === 0) {
                        this.note(context, bus, chord[0] - 12, nextBeatAt,
                            beatLength * 6, 0.035);
                    }
                    const sequence = [0, 2, 1, 3, 2, 1, 3, 1];
                    this.note(context, bus, chord[sequence[beat % 8]] + 12,
                        nextBeatAt, beatLength * 1.8, 0.12, "triangle");
                }
                beat++;
                nextBeatAt += beatLength;
            }
        };
        schedule();
        this.interval = window.setInterval(schedule, 160);
        return true;
    }

    async cue(kind: Cue, volume: number): Promise<void> {
        const context = await this.getContext();
        if (!context || this.disposed) return;
        const output = context.createGain();
        output.gain.value = Math.max(0, Math.min(1, volume)) * 0.4;
        output.connect(context.destination);
        const now = context.currentTime + 0.01;
        const tones = kind === "complete" ? [72, 76, 79, 84]
            : kind === "start" ? [64, 69] : [69, 64];
        const duration = kind === "complete" ? 0.22 : 0.13;
        tones.forEach((midi, index) => this.note(context, output, midi,
            now + index * duration, duration * 1.5, 0.17, "sine"));
        window.setTimeout(() => output.disconnect(), (tones.length + 2) * duration * 1000);
    }

    dispose(): void {
        this.disposed = true;
        this.stop();
        void this.context?.close().catch(() => {});
        this.context = null;
    }
}
