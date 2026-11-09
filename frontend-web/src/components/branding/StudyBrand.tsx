import mark from './mark';
import './brand.css';
export function StudyMark({ size = 36, decorative = false }: { size?: number; decorative?: boolean }) {
    return <svg data-study-mark viewBox={`0 0 ${mark.grid} ${mark.grid}`} width={size} height={size}
        shapeRendering="crispEdges" focusable="false" role={decorative ? undefined : 'img'}
        aria-hidden={decorative || undefined} aria-label={decorative ? undefined : 'StudyStreak coffee mark'}>
        {mark.rects.filter(rect => size > 24 || rect[5] !== 'detail').map(([x,y,width,height,role], index) =>
            <rect key={index} x={x} y={y} width={width} height={height} className={`study-mark-${role}`} />)}
    </svg>;
}
export function PixelRule() { return <span className="study-brand-rule" aria-hidden="true" />; }
export function StudyBrand({ variant = 'navigation' }: { variant?: 'navigation' | 'compact' | 'signature' }) {
    const signature = variant === 'signature';
    return <div className={`study-brand study-brand-${variant}`} role="img" aria-label="StudyStreak">
        <StudyMark size={signature ? 64 : variant === 'compact' ? 32 : 36} decorative />
        <div className="study-brand-copy" aria-hidden="true">
            <span className="study-brand-name">Study<span>Streak</span></span>
            {variant !== 'compact' ? <span className="study-brand-tagline">Small sessions. Lasting progress.</span> : null}
        </div>
        {signature ? <PixelRule /> : null}
    </div>;
}
