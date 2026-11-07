import { Check, Pause, Play } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "../ui/carousel";
import { SOUND_CATEGORIES, SOUNDSCAPES } from "../dashboard/soundscapes";
import type { SoundCategory, SoundscapeInfo } from "../dashboard/soundscapes";
import type { Soundscape } from "../dashboard/pomodoroState";
import { TrackArtwork } from "./TrackArtwork";

interface SoundscapeCarouselProps {
    tracks: readonly SoundscapeInfo[];
    category: SoundCategory | "all";
    onCategoryChange: (category: SoundCategory | "all") => void;
    selected: Soundscape;
    playing: boolean;
    onChooseTrack: (track: Soundscape) => Promise<void>;
}

export function SoundscapeCarousel({ tracks, category, onCategoryChange, selected, playing, onChooseTrack }: SoundscapeCarouselProps) {
    return <section aria-labelledby="sound-library-heading" className="min-w-0 space-y-3">
        <div><h2 id="sound-library-heading" className="text-xl font-semibold text-content">Find your focus sound</h2><p className="mt-1 text-sm text-content-muted">{SOUNDSCAPES.length} original soundscapes. Instrumentals, color noise and calming spaces.</p></div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter study sounds by category">
            {SOUND_CATEGORIES.map(item => <button type="button" key={item.id} className="study-tab border border-outline px-3" aria-pressed={category === item.id} onClick={() => onCategoryChange(item.id)}>{item.label}</button>)}
        </div>
        <Carousel key={category} aria-label="Study soundscapes" opts={{ align: "start", loop: false, breakpoints: { "(prefers-reduced-motion: reduce)": { duration: 0 } } }}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-content-muted" role="status">{tracks.length} {tracks.length === 1 ? "sound" : "sounds"} · Swipe, use arrows or Tab to explore</p><div className="flex gap-2"><CarouselPrevious/><CarouselNext/></div></div>
            <CarouselContent>
                {tracks.map((item, index) => <CarouselItem key={item.id} aria-label={`${index + 1} of ${tracks.length}`} className="basis-[85%] sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                    <button type="button" onClick={() => void onChooseTrack(item.id)} aria-pressed={selected === item.id} aria-label={`${selected === item.id && playing ? "Pause" : "Play"} ${item.title}, ${item.kind}`}
                        className={`group h-full w-full rounded-panel border p-3 text-left hover:bg-surface-hover ${selected === item.id ? "border-accent bg-accent-soft" : "border-outline bg-surface"}`}>
                        <div className="relative"><TrackArtwork track={item.id} thumbnail/><span className="absolute right-2 bottom-2 flex size-11 items-center justify-center rounded-full bg-accent text-on-accent" aria-hidden="true">{selected === item.id && playing ? <Pause size={18} fill="currentColor"/> : <Play size={18} fill="currentColor"/>}</span></div>
                        <div className="mt-3 flex items-center gap-2"><h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-content">{item.title}</h3>{selected === item.id && <Check size={15} className="shrink-0 text-accent" aria-hidden="true"/>}</div>
                        <p className="mt-1 text-xs font-medium text-accent">{item.kind}</p><p className="mt-2 line-clamp-2 text-xs leading-relaxed text-content-muted">{item.description}</p>
                        <span className="sr-only">Track {SOUNDSCAPES.findIndex(sound => sound.id === item.id) + 1} of {SOUNDSCAPES.length}</span>
                    </button>
                </CarouselItem>)}
            </CarouselContent>
        </Carousel>
    </section>;
}
