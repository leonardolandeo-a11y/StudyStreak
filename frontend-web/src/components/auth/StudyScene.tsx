import { BarrancoSilhouette } from '../branding/BarrancoSilhouette';
import { useId, useState } from 'react';
import scene from './sceneData';
import type { StudyPeriod } from './studyPeriod';
import { useAmbientMotion } from './useAmbientMotion';
type SceneRect = readonly [number,number,number,number,keyof typeof scene.palettes.night,string];
export function StudyScene({ period }: { period: StudyPeriod | null }) {
    const active = useAmbientMotion();
    const [failed, setFailed] = useState(false);
    const clipId = useId();
    const current = period ?? 'night';
    const [x,y,width,height] = scene.window.clip;
    const paint = (rows: readonly SceneRect[]) => rows.filter(row => row[5] === 'all' || row[5] === current || (row[5] === 'day' && current !== 'night')).map(([x,y,width,height,role], index) =>
        <rect key={index} x={x} y={y} width={width} height={height} fill={scene.palettes[current][role]} />);
    return <div className="auth-scene" data-study-period={period ?? 'pending'} data-ambient={active && !failed ? 'running' : 'paused'} aria-hidden="true">
        <img className="auth-scene-base" src={`/auth/study-room-${current}.${failed ? 'png' : 'svg'}`} alt="" draggable={false} onError={() => setFailed(true)} />
        {!failed ? <svg viewBox={`0 0 ${scene.width} ${scene.height}`} shapeRendering="crispEdges" preserveAspectRatio="xMidYMid slice" focusable="false">
            <defs><clipPath id={clipId}><rect x={x} y={y} width={width} height={height} /></clipPath></defs>
            <g clipPath={`url(#${clipId})`}>
                <g className="auth-effect auth-effect-landscape">{paint(scene.window.landscape)}</g>
                <g data-auth-campus transform="translate(58 90) scale(.72)" opacity=".5"><BarrancoSilhouette building={scene.palettes[current].distant} shade={scene.palettes[current].horizon} detail={scene.palettes[current].sky} lights={scene.palettes[current].sun}/></g>
                <g className="auth-effect auth-effect-clouds">{paint(scene.effects.clouds)}</g>
                <g className="auth-effect auth-effect-stars">{paint(scene.effects.stars)}</g>
            </g>
            <g data-window-frame>{paint(scene.window.frame)}</g>
            <g className="auth-effect auth-effect-steam">{paint(scene.effects.steam)}</g>
            <g className="auth-effect auth-effect-glow">{paint(scene.effects.glow)}</g>
        </svg> : null}
    </div>;
}
