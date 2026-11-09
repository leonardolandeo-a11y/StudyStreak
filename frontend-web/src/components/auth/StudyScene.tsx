import scene from './sceneData';
import type { StudyPeriod } from './studyPeriod';
export function StudyScene({ period }: { period: StudyPeriod | null }) {
    return <div className="auth-scene" data-study-period={period ?? 'pending'} aria-hidden="true">
        {period ? <svg viewBox={`0 0 ${scene.width} ${scene.height}`} shapeRendering="crispEdges" preserveAspectRatio="xMidYMid slice" focusable="false">
            {scene.rects.filter(row => row[5] === 'all' || row[5] === period).map(([x,y,width,height,role], index) =>
                <rect key={index} x={x} y={y} width={width} height={height} fill={scene.palettes[period][role]} />)}
        </svg> : null}
    </div>;
}
