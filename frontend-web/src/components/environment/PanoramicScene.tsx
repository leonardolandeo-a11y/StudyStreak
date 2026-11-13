import { useId, useState } from 'react';
import type { StudyPeriod } from '../auth/studyPeriod';

// Masks stay inside the panes: the room, wooden frames and UI never move.
const panes = [[.445,.572,.128,.29],[.586,.708,.128,.29],[.723,.831,.128,.29]];
export function PanoramicScene({ period, moving }: { period: StudyPeriod; moving: boolean }) {
    const id = useId();
    const [failed, setFailed] = useState(false);
    const source = failed ? '/environments/academy-pixel-static.png' : `/environments/academy-pixel-${period}.webp`;
    return <svg className="panorama-art" viewBox="0 0 2172 724" preserveAspectRatio="xMaxYMax slice" aria-hidden="true" focusable="false"
        data-environment-period={period} data-ambient={moving && !failed ? 'running' : 'paused'} data-fallback={failed}>
        <defs>
            <clipPath id={`${id}-sky`}>{panes.map(([left,right,top,bottom],i) => <rect key={i} x={left*2172} y={top*724} width={(right-left)*2172} height={(bottom-top)*724} />)}</clipPath>
            <clipPath id={`${id}-landscape`}>{panes.map(([left,right],i) => <rect key={i} x={left*2172} y={.435*724} width={(right-left)*2172} height={.09*724} />)}</clipPath>
            <radialGradient id={`${id}-lamp`}><stop stopColor="#ffc67d" stopOpacity=".35"/><stop offset="1" stopColor="#ffc67d" stopOpacity="0"/></radialGradient>
        </defs>
        <image className="panorama-base" href={source} width="2172" height="724" onError={() => setFailed(true)} />
        {!failed ? <>
            <g clipPath={`url(#${id}-sky)`}><image className="panorama-clouds panorama-effect" href={source} width="2172" height="724" /></g>
            <g clipPath={`url(#${id}-landscape)`}><image className="panorama-landscape panorama-effect" href={source} width="2172" height="724" /></g>
            <ellipse className="panorama-light panorama-effect" cx="1750" cy="532" rx="260" ry="150" fill={`url(#${id}-lamp)`} opacity={period === 'night' ? .35 : .12} />
            <g className="panorama-steam panorama-effect" fill="none" stroke="#fff1d6" strokeWidth="2.5" strokeLinecap="round" opacity=".3">
                <path d="M1544 505q-10-14 0-29t0-23"/><path d="M1557 500q10-16 0-28t0-19"/>
            </g>
        </> : null}
    </svg>;
}
