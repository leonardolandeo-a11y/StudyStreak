import { useId, useState } from "react";
import { Check, Pause, Play } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "../ui/carousel";
import { SOUND_CATEGORIES, SOUNDSCAPES } from "../dashboard/soundscapes";
import type { SoundCategory, SoundscapeInfo } from "../dashboard/soundscapes";
import type { Soundscape } from "../dashboard/pomodoroState";
import { useReducedMotion } from "../../theme/appearance";
import { TrackArtwork } from "./TrackArtwork";

interface SoundscapeCarouselProps {
    tracks: readonly SoundscapeInfo[];
    category: SoundCategory | "all";
    onCategoryChange: (category: SoundCategory | "all") => void;
    selected: Soundscape;
    playing: boolean;
    onChooseTrack: (track: Soundscape) => Promise<void>;
}

function SoundCard({ track, selected, playing, onChooseTrack }: {
    track: SoundscapeInfo;
    selected: boolean;
    playing: boolean;
    onChooseTrack: (track: Soundscape) => Promise<void>;
}) {
    const [showInfo, setShowInfo] = useState(false);
    const descriptionId = useId();
    return (
        <article className={`group h-full rounded-panel border p-2 ${selected ? "border-accent bg-accent-soft" : "border-outline bg-surface"}`}>
            <div className="relative isolate overflow-hidden rounded-control">
                <TrackArtwork track={track.id} thumbnail />
                <div id={descriptionId} className={`pointer-events-none absolute inset-0 flex flex-col justify-center gap-2 bg-canvas/95 px-3 pb-14 pt-4 transition-opacity duration-150 motion-reduce:transition-none group-hover:opacity-100 group-has-[:focus-visible]:opacity-100 ${showInfo ? "opacity-100" : "opacity-0"}`}>
                    <p className="text-xs font-semibold text-accent">{track.kind}</p>
                    <p className="text-xs leading-relaxed text-content">{track.description}</p>
                </div>
                <button type="button" aria-label={`Description for ${track.title}`} aria-expanded={showInfo} aria-controls={descriptionId} aria-describedby={descriptionId}
                    onClick={() => setShowInfo(value => !value)}
                    className="absolute inset-1.5 rounded-control" />
                <button type="button" onClick={() => void onChooseTrack(track.id)} aria-pressed={selected} aria-describedby={descriptionId}
                    aria-label={`${selected && playing ? "Pause" : "Play"} ${track.title}, ${track.kind}`}
                    className="absolute bottom-2 right-2 flex size-11 items-center justify-center rounded-full bg-accent text-on-accent hover:bg-accent-hover">
                    {selected && playing ? <Pause size={18} fill="currentColor" aria-hidden="true" /> : <Play size={18} fill="currentColor" aria-hidden="true" />}
                </button>
            </div>
            <div className="flex items-center gap-2 px-1 pb-1 pt-3">
                <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-content" title={track.title}>{track.title}</h3>
                {selected && <span className="shrink-0 text-accent"><Check size={16} aria-hidden="true" /><span className="sr-only">{playing ? "Playing" : "Selected"}</span></span>}
            </div>
        </article>
    );
}

export function SoundscapeCarousel({ tracks, category, onCategoryChange, selected, playing, onChooseTrack }: SoundscapeCarouselProps) {
    const reducedMotion = useReducedMotion();
    return <section aria-labelledby="sound-library-heading" className="min-w-0 space-y-3">
        <div><h2 id="sound-library-heading" className="text-xl font-semibold text-content">Find your focus sound</h2><p className="mt-1 text-sm text-content-muted">{SOUNDSCAPES.length} original soundscapes. Instrumentals, color noise and calming spaces.</p></div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter study sounds by category">
            {SOUND_CATEGORIES.map(item => <button type="button" key={item.id} className="study-tab border border-outline px-3" aria-pressed={category === item.id} onClick={() => onCategoryChange(item.id)}>{item.label}</button>)}
        </div>
        <Carousel key={category} aria-label="Study soundscapes" opts={{ duration: reducedMotion ? 0 : 25, align: "start", loop: true, breakpoints: { "(prefers-reduced-motion: reduce)": { duration: 0 } } }}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-content-muted" role="status">{tracks.length} {tracks.length === 1 ? "sound" : "sounds"} · Swipe, use arrows or Tab to explore</p><div className="flex gap-2"><CarouselPrevious/><CarouselNext/></div></div>
            <CarouselContent>
                {tracks.map((track, index) => <CarouselItem key={track.id} aria-label={`${index + 1} of ${tracks.length}`} className="sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                    <SoundCard track={track} selected={selected === track.id} playing={playing} onChooseTrack={onChooseTrack} />
                </CarouselItem>)}
            </CarouselContent>
        </Carousel>
    </section>;
}
