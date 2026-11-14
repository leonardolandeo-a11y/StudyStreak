import { useId, useState } from 'react';
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
export function StudyBrand({ variant = 'navigation', interactive = false }: { variant?: 'navigation' | 'compact' | 'signature'; interactive?: boolean }) {
    const signature = variant === 'signature', tagline = useId();
    const [dismissed,setDismissed] = useState(false);
    const [hovered,setHovered] = useState(false), [focused,setFocused] = useState(false);
    return <div className={`study-brand study-brand-${variant}${interactive ? ' study-brand-interactive' : ''}`} role={interactive ? 'group' : 'img'} aria-label="StudyStreak"
        data-brand-dismissed={dismissed || undefined} onMouseEnter={interactive ? () => { setHovered(true); setDismissed(false); } : undefined} onMouseLeave={interactive ? () => setHovered(false) : undefined}
        onFocusCapture={interactive ? () => { setFocused(true); setDismissed(false); } : undefined} onBlurCapture={interactive ? event => { if(!event.currentTarget.contains(event.relatedTarget))setFocused(false); } : undefined} onKeyDown={interactive ? event => { if(event.key === 'Escape')setDismissed(true); } : undefined}>
        <StudyMark size={signature ? 64 : variant === 'compact' ? 32 : interactive ? 44 : 36} decorative />
        <div className="study-brand-copy" aria-hidden={interactive ? undefined : true}>
            <span className="study-brand-name" tabIndex={interactive ? 0 : undefined} aria-describedby={interactive ? tagline : undefined}>Study<span>Streak</span></span>
            {variant !== 'compact' ? <span id={tagline} role={interactive && (hovered || focused) && !dismissed ? 'tooltip' : undefined} className="study-brand-tagline">Small sessions. Lasting progress.</span> : null}
        </div>
        {signature ? <PixelRule /> : null}
    </div>;
}
