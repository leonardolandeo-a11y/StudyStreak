import sprites from './sprites';
export type AcademicSpriteName = keyof typeof sprites;
/** Original local decoration, deliberately absent from the accessibility tree. */
export function AcademicSprite({ name, width = 64, className = '' }: { name: AcademicSpriteName; width?: number; className?: string }) {
    const sprite = sprites[name];
    return <img data-academic-sprite={name} src={`/academic/${name}.svg`} width={width} height={width * sprite.height / sprite.width}
        alt="" aria-hidden="true" draggable={false} className={`academic-sprite ${className}`} style={{ imageRendering: 'pixelated', flexShrink: 0 }}/>;
}
