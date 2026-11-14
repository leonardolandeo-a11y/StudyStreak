import { useId, useState } from 'react';
import type { StudyPeriod } from '../auth/studyPeriod';
import type { SceneId } from '../../features/environment/environmentPreferences';
import { scenes, sceneSource } from './scenes';

export function PanoramicScene({ period, moving, sceneId }: { period: StudyPeriod; moving: boolean; sceneId: SceneId }) {
    const id = useId();
    const [failed, setFailed] = useState(false);
    const { panes, steam, lamp, effect } = scenes[sceneId];
    const source = failed ? '/environments/study-v2/campus-thumb.webp' : sceneSource(sceneId);
    return <>
        <svg className="panorama-art" viewBox="0 0 2172 724" preserveAspectRatio={scenes[sceneId].align ?? "xMaxYMax slice"} aria-hidden="true" focusable="false"
            data-environment-period={period} data-environment={sceneId} data-ambient={moving && !failed ? 'running' : 'paused'} data-fallback={failed}>
            <defs>
                <clipPath id={`${id}-window`}>{panes.map(([left,right,top,bottom],i) => <rect key={i} x={left*2172} y={top*724} width={(right-left)*2172} height={(bottom-top)*724}/>)}</clipPath>
                <radialGradient id={`${id}-lamp`}><stop stopColor="#ffc67d" stopOpacity=".25"/><stop offset="1" stopColor="#ffc67d" stopOpacity="0"/></radialGradient>
            </defs>
            <image className="panorama-base" href={source} width="2172" height="724" onError={() => setFailed(true)}/>
            {!failed ? <>
                {effect === 'clouds' && <g clipPath={`url(#${id}-window)`}><image className="panorama-clouds panorama-effect" href={source} width="2172" height="724"/></g>}
                {effect === 'rain' && <g clipPath={`url(#${id}-window)`}><g className="panorama-rain panorama-effect" stroke="#dce5ff" strokeWidth="2" opacity=".3">
                    {panes.flatMap(([left,right,top,bottom],pane) => Array.from({ length: 16 },(_,index) => {
                        const x = (left + (right-left)*((index*7%17)/17))*2172, y = (top+(bottom-top)*((index*11%17)/17))*724;
                        return <path key={`${pane}-${index}`} d={`M${x} ${y}l-4 15`}/>;
                    }))}
                </g></g>}
                {effect === 'stars' && <g clipPath={`url(#${id}-window)`}><g className="panorama-stars panorama-effect" fill="#ffe8b8">
                    {[[.49,.20],[.54,.28],[.61,.21],[.76,.24],[.80,.18]].map(([x,y],i) => <rect key={i} x={x*2172} y={y*724} width="3" height="3"/>)}
                </g></g>}
                <ellipse className="panorama-light panorama-effect" cx={lamp[0]*2172} cy={lamp[1]*724} rx="200" ry="110" fill={`url(#${id}-lamp)`}/>
                <g transform={`translate(${steam[0]*2172} ${steam[1]*724})`}><g className="panorama-steam panorama-effect" fill="none" stroke="#fff1d6" strokeWidth="2" strokeLinecap="round" opacity=".3">
                    <path d="M0 0q-10-14 0-29t0-23"/><path d="M13-5q10-16 0-28t0-19"/>
                </g></g>
            </> : null}
        </svg>
        {failed && <span role="status" className="environment-fallback-note">Illustration unavailable · static study nook</span>}
    </>;
}
