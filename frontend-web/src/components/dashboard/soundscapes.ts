import type { Soundscape } from "./pomodoroState";

export type SoundCategory = "instrumental" | "noise" | "nature" | "spaces";

export interface SoundscapeInfo {
    id: Soundscape;
    title: string;
    kind: string;
    description: string;
    category: SoundCategory;
    gradient: string;
}

/**
 * All tracks are original synthesis recipes, not third-party recordings.
 * Instrumental styles are not renditions of copyrighted compositions.
 */
export const SOUNDSCAPES: readonly SoundscapeInfo[] = [
    {
        id: "dream", title: "Midnight Drift", kind: "Ambient pads",
        description: "Floating chords and slow-moving harmonies for calm, uninterrupted work.",
        category: "instrumental", gradient: "from-violet-800 via-indigo-900 to-slate-950"
    },
    {
        id: "keys", title: "Slow Motion", kind: "Soft piano",
        description: "Gentle repeating keys with plenty of space between each note.",
        category: "instrumental", gradient: "from-orange-700 via-rose-900 to-slate-950"
    },
    {
        id: "classical", title: "Chamber Light", kind: "Classical-inspired",
        description: "An original, delicate chamber-style melody with flowing arpeggios.",
        category: "instrumental", gradient: "from-amber-700 via-stone-800 to-slate-950"
    },
    {
        id: "lofi", title: "Late Night Notes", kind: "Lo-fi instrumental",
        description: "Mellow jazz chords, soft bass and a relaxed, low-key beat.",
        category: "instrumental", gradient: "from-fuchsia-800 via-purple-900 to-slate-950"
    },
    {
        id: "white", title: "Blank Canvas", kind: "White noise",
        description: "A smooth full-spectrum hiss to mask distracting background noises.",
        category: "noise", gradient: "from-slate-500 via-slate-700 to-slate-950"
    },
    {
        id: "pink", title: "Soft Static", kind: "Pink noise",
        description: "A gentler, balanced wash of sound with less high-frequency energy.",
        category: "noise", gradient: "from-pink-700 via-rose-900 to-slate-950"
    },
    {
        id: "brown", title: "Deep Current", kind: "Brown noise",
        description: "A low, deep rushing sound with a soft, warm rumble.",
        category: "noise", gradient: "from-amber-900 via-orange-950 to-slate-950"
    },
    {
        id: "rain", title: "After the Rain", kind: "Soft rainfall",
        description: "Steady rain against the window, without thunder or sudden changes.",
        category: "nature", gradient: "from-cyan-800 via-blue-900 to-slate-950"
    },
    {
        id: "forest", title: "Morning Canopy", kind: "Forest ambience",
        description: "Soft forest wind and occasional little bird-like calls.",
        category: "nature", gradient: "from-green-700 via-emerald-950 to-slate-950"
    },
    {
        id: "ocean", title: "Tidal Breathing", kind: "Ocean waves",
        description: "Slow waves moving in and out against a distant shoreline.",
        category: "nature", gradient: "from-teal-700 via-blue-950 to-slate-950"
    },
    {
        id: "cafe", title: "Quiet Café", kind: "Café ambience",
        description: "Low café-like ambience with subtle cup sounds and no intelligible speech.",
        category: "spaces", gradient: "from-yellow-800 via-amber-950 to-slate-950"
    },
    {
        id: "fireplace", title: "Hearthside", kind: "Fireplace",
        description: "Warm fireplace-like crackles under a gentle, soft background.",
        category: "spaces", gradient: "from-orange-700 via-red-950 to-slate-950"
    }
];

export const SOUND_CATEGORIES: readonly { id: SoundCategory | "all"; label: string }[] = [
    { id: "all", label: "All sounds" },
    { id: "instrumental", label: "Instrumental" },
    { id: "noise", label: "Color noise" },
    { id: "nature", label: "Nature" },
    { id: "spaces", label: "Cozy spaces" }
];

export function soundscapeById(id: Soundscape): SoundscapeInfo {
    return SOUNDSCAPES.find(sound => sound.id === id) ?? SOUNDSCAPES[0];
}
