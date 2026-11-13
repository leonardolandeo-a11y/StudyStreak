import campus from '../../../assets/environments/study-v1/campus.png';
import library from '../../../assets/environments/study-v1/library.png';
import night from '../../../assets/environments/study-v1/night.png';
import cafe from '../../../assets/environments/study-v1/cafe.png';
import campusThumb from '../../../assets/environments/study-v1/campus-thumb.png';
import libraryThumb from '../../../assets/environments/study-v1/library-thumb.png';
import nightThumb from '../../../assets/environments/study-v1/night-thumb.png';
import cafeThumb from '../../../assets/environments/study-v1/cafe-thumb.png';
import fallback from '../../../assets/environments/academy-pixel-static.png';
import type { SceneId } from '../../features/environment/environmentPreferences';
export const scenePictures = { campus,library,night,cafe };
export const sceneThumbnails = { campus: campusThumb,library: libraryThumb,night: nightThumb,cafe: cafeThumb };
export { fallback };
type Pane = readonly [number,number,number,number];
/** Same normalized window/steam coordinates as the approved Web artwork. */
export const scenes: Record<SceneId, { panes: readonly Pane[]; steam: readonly [number,number]; effect: 'clouds' | 'rain' | 'stars' }> = {
    campus: { panes: [[.454,.576,.145,.29],[.59,.718,.145,.29],[.735,.844,.145,.29]], steam: [.75,.685], effect: 'clouds' },
    library: { panes: [[.468,.596,.18,.59],[.609,.716,.18,.59],[.735,.847,.18,.59]], steam: [.752,.70], effect: 'rain' },
    night: { panes: [[.45,.566,.15,.37],[.582,.708,.15,.37],[.728,.828,.15,.37]], steam: [.741,.695], effect: 'stars' },
    cafe: { panes: [[.452,.578,.14,.26],[.594,.705,.14,.26],[.72,.825,.14,.26]], steam: [.724,.705], effect: 'clouds' },
};
