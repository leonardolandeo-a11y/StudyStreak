import type { ReactNode } from 'react';
import { StudyMark, PixelRule } from '../branding/StudyBrand';
import glyphs from './glyphs';
import './academic.css';
export type AcademicGlyph = Exclude<keyof typeof glyphs, 'grid'>;
export function PixelGlyph({ name = 'book', size = 28 }: { name?: AcademicGlyph; size?: number }) {
    return <svg data-pixel-glyph={name} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" shapeRendering="crispEdges">
        {glyphs[name].map(([x,y,width,height,role],index) => <rect key={index} x={x} y={y} width={width} height={height} className={`academic-fill-${role}`} />)}
    </svg>;
}
export function AcademicHeading({ title, eyebrow, description, focus = false, children }: { title: string; eyebrow: string; description?: string; focus?: boolean; children?: ReactNode }) {
    return <header className="academic-heading"><div className="academic-heading-copy">
        <div className="academic-heading-kicker">{focus ? <StudyMark size={28} decorative /> : <PixelGlyph name="book" />}<span>{eyebrow}</span><PixelRule /></div>
        <h1>{title}</h1>{description ? <p>{description}</p> : null}
    </div>{children}</header>;
}
export function AcademicEmpty({ children }: { children: ReactNode }) {
    return <div className="academic-empty"><PixelGlyph name="book" size={36} /><div>{children}</div></div>;
}
export function PixelProgress({ value, max = 100, label }: { value: number; max?: number; label: string }) {
    const percent = Math.max(0, Math.min(100, max > 0 ? value / max * 100 : 0));
    return <div className="academic-progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
        <span style={{ width: `${percent}%` }} />
    </div>;
}
