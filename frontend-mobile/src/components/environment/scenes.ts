import campus from '../../../assets/environments/study-v2/campus.png';
import library from '../../../assets/environments/study-v2/library.png';
import night from '../../../assets/environments/study-v2/night.png';
import cafe from '../../../assets/environments/study-v2/cafe.png';
import campusThumb from '../../../assets/environments/study-v2/campus-thumb.png';
import libraryThumb from '../../../assets/environments/study-v2/library-thumb.png';
import nightThumb from '../../../assets/environments/study-v2/night-thumb.png';
import cafeThumb from '../../../assets/environments/study-v2/cafe-thumb.png';
import fallback from '../../../assets/environments/academy-pixel-static.png';
import type { SceneId } from '../../features/environment/environmentPreferences';
export const scenePictures = { campus,library,night,cafe };
export const sceneThumbnails = { campus: campusThumb,library: libraryThumb,night: nightThumb,cafe: cafeThumb };
export { fallback };
type Pane = readonly [number,number,number,number];
/** Normalized masks lie inside the artwork's windows, clear of shelves and frames. */
export const scenes: Record<SceneId, { panes: readonly Pane[]; steam: readonly [number,number]; lamp: readonly [number,number]; effect: 'clouds' | 'rain' | 'stars'; align?: 'xMaxYMid slice' }> = {
    campus: { panes: [[.48,.585,.04,.28],[.605,.79,.04,.28],[.81,.96,.04,.28]], steam: [.772,.655], lamp: [.91,.46], effect: 'clouds' },
    library: { panes: [[.505,.615,.14,.35],[.63,.74,.14,.35],[.755,.865,.14,.35],[.505,.615,.4,.62],[.63,.74,.4,.62],[.755,.865,.4,.62]], steam: [.792,.68], lamp: [.845,.51], effect: 'rain' },
    night: { align: 'xMaxYMid slice', panes: [[.49,.595,.15,.365],[.61,.735,.15,.365],[.75,.85,.15,.365],[.49,.595,.41,.65],[.61,.735,.41,.65],[.75,.85,.41,.65]], steam: [.78,.68], lamp: [.83,.55], effect: 'rain' },
    cafe: { panes: [[.43,.615,.09,.22],[.63,.735,.09,.22],[.75,.89,.09,.22]], steam: [.778,.73], lamp: [.83,.58], effect: 'clouds' },
};
