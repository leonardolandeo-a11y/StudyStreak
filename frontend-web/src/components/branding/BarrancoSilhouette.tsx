/** Original pixel geometry: stepped campus terraces, coastal slope, low houses and bridge.
 * Decorative interpretation, not a map or an architectural survey. viewBox: 0 0 128 46.
 */
export function BarrancoSilhouette({ building='var(--sidebar-city-building, var(--ss-border-strong))', shade='var(--ss-text-muted)', detail='var(--ss-surface-hover)', lights='var(--ss-accent)' }: {building?:string;shade?:string;detail?:string;lights?:string}) {
    return <g data-barranco-silhouette>
        <path data-city-tone="building" fill={building} d="M0 40h12v-4h19v3h13v-3h42v3h18v2h24v5H0z"/>
        <g data-barranco-part="terraced-campus" fill={building}>
            <path d="M40 38V16h7V10h12V8h13v5h8v6h7v6h7v6h7v11H40z"/>
            <path fill={shade} d="M43 14h37v2H43zm-3 7h47v2H40zm0 7h54v2H40zm0 7h61v2H40z"/>
            <path fill={detail} d="M46 16h3v5h-3zm11 0h3v5h-3zm12 0h3v5h-3zM44 23h4v5h-4zm12 0h4v5h-4zm13 0h4v5h-4zM44 30h4v5h-4zm13 0h4v5h-4zm13 0h4v5h-4zm13 0h4v5h-4zM48 37h6v5h-6zm19 0h6v5h-6zm19 0h6v5h-6z"/>
            <path fill={lights} opacity=".55" d="M52 19h3v1h-3zm12 7h3v1h-3zm13 7h4v1h-4z"/>
        </g>
        <g data-barranco-part="coastal-bridge" fill={shade}>
            <path d="M9 31h29v2H9zm0 4h29v2H9zm2-4v-4h1v4zm7 0v-4h1v4zm8 0v-4h1v4zm9 0v-4h1v4zM11 37h5v6h-5zm20 0h5v6h-5z"/>
            <path d="M13 38v-2h21v2h-4v2h-3v2h-2v-2h-3v-2z"/>
        </g>
        <g data-barranco-part="neighbourhood" fill={building}>
            <path d="M0 29h5v-3h7v3h4v10H0zM104 30h4v-3h9v3h5v11h-18z"/>
            <path fill={detail} d="M3 32h2v4H3zm5 0h2v4H8zM108 33h3v5h-3zm7 0h3v5h-3z"/>
            <path fill={shade} d="M124 41h2V22h-2zm-7-19h6v-2h4v2h1v2h-5v-1h-6z"/>
        </g>
        <path data-city-tone="star" fill={lights} opacity=".6" d="M22 11h1v4h-1zm-1 1h3v1h-3zM105 8h1v3h-1zm-1 1h3v1h-3z"/>
    </g>;
}
