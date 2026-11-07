import { AudioLines, CloudRain, Coffee, Disc3, Flame, MoonStar, Music2, Piano, Radio, Trees, Waves } from "lucide-react";
import { soundscapeById } from "../dashboard/soundscapes";
import type { Soundscape } from "../dashboard/pomodoroState";

const TRACK_ICONS: Record<Soundscape, typeof MoonStar> = {
    dream: MoonStar,
    keys: Piano,
    classical: Music2,
    lofi: Disc3,
    white: Radio,
    pink: AudioLines,
    brown: Waves,
    rain: CloudRain,
    forest: Trees,
    ocean: Waves,
    cafe: Coffee,
    fireplace: Flame
};

export function TrackArtwork({ track, compact = false, thumbnail = false }: {
    track: Soundscape;
    compact?: boolean;
    thumbnail?: boolean;
}) {
    const color = soundscapeById(track).gradient;
    const Icon = TRACK_ICONS[track];

    return (
        <div aria-hidden="true" className={`relative isolate flex shrink-0 text-artwork-content items-center justify-center overflow-hidden bg-gradient-to-br ${color} ${compact ? "h-14 w-14 rounded-lg" : thumbnail ? "aspect-square w-full rounded-control" : "aspect-square w-full rounded-panel"}`}>
            <div aria-hidden="true" className="absolute -right-1/4 -top-1/4 h-3/4 w-3/4 rounded-full bg-white/10 blur-2xl" />
            <div aria-hidden="true" className={`absolute rounded-full border border-white/20 bg-black/25 shadow-2xl shadow-appearance-shadow/30 ${compact ? "h-11 w-11" : "h-[70%] w-[70%]"}`}>
                <div className="absolute inset-[13%] rounded-full border border-white/15" />
                <div className="absolute inset-[27%] rounded-full border border-white/10" />
                <div className="absolute inset-[42%] rounded-full border border-white/20 bg-white/15" />
            </div>
            <Icon aria-hidden="true" className={`relative drop-shadow-lg ${compact ? "h-5 w-5" : "h-16 w-16 sm:h-20 sm:w-20"}`} strokeWidth={1.25} />
            {!compact && !thumbnail && <span className="absolute bottom-4 left-5 text-[10px] font-bold uppercase tracking-[0.28em] text-white/60">STUDYSTREAK ORIGINALS</span>}
        </div>
    );
}
