import { useState } from 'react';
import scene from './sceneData';
import type { StudyPeriod } from './studyPeriod';
import { useAmbientMotion } from './useAmbientMotion';
export function StudyScene({ period }: { period: StudyPeriod | null }) {
    const active = useAmbientMotion();
    const [failed, setFailed] = useState(false);
    const current = period ?? 'night';
    return <div className="auth-scene" data-study-period={period ?? 'pending'} data-ambient={active && !failed ? 'running' : 'paused'} aria-hidden="true">
        <img className="auth-scene-base" src={`/auth/study-room-${current}.${failed ? 'png' : 'svg'}`} alt="" draggable={false}
            onError={() => setFailed(true)} />
        {!failed ? <svg viewBox={`0 0 ${scene.width} ${scene.height}`} shapeRendering="crispEdges" preserveAspectRatio="xMidYMid slice" focusable="false">
            {Object.entries(scene.effects).map(([name,rows]) => <g key={name} className={`auth-effect auth-effect-${name}`}>
                {rows.filter(row => row[5] === 'all' || row[5] === current || (row[5] === 'day' && current !== 'night')).map(([x,y,width,height,role], index) =>
                    <rect key={index} x={x} y={y} width={width} height={height} fill={scene.palettes[current][role]} />)}
            </g>)}
        </svg> : null}
    </div>;
}
