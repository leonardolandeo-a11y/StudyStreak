import type { SceneId } from '../../features/environment/environmentPreferences';
type Pane = readonly [number,number,number,number];
/** Normalized masks lie inside the artwork's windows, clear of shelves and frames. */
export const scenes: Record<SceneId, { panes: readonly Pane[]; steam: readonly [number,number]; lamp: readonly [number,number]; effect: 'clouds' | 'rain' | 'stars'; align?: 'xMaxYMid slice' }> = {
    campus: { panes: [[.454,.576,.145,.29],[.59,.718,.145,.29],[.735,.844,.145,.29]], steam: [.75,.685], lamp: [.855,.72], effect: 'clouds' },
    library: { panes: [[.468,.596,.18,.59],[.609,.716,.18,.59],[.735,.847,.18,.59]], steam: [.752,.70], lamp: [.85,.70], effect: 'rain' },
    night: { align: 'xMaxYMid slice', panes: [[.45,.566,.15,.37],[.582,.708,.15,.37],[.728,.828,.15,.37]], steam: [.741,.695], lamp: [.85,.72], effect: 'stars' },
    cafe: { panes: [[.452,.578,.14,.26],[.594,.705,.14,.26],[.72,.825,.14,.26]], steam: [.724,.705], lamp: [.46,.54], effect: 'clouds' },
};
export const sceneSource = (id: SceneId) => `/environments/study-v1/${id}.webp`;
export const sceneThumbnail = (id: SceneId) => `/environments/study-v1/${id}-thumb.webp`;
