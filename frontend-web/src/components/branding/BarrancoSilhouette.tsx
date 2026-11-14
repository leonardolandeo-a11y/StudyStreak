/** Deliberately coarse, flat pixel shapes. Shared decorative viewBox: 0 0 128 46. */
export function BarrancoSilhouette({ building='var(--sidebar-city-building, var(--ss-border-strong))', shade='var(--ss-text-muted)', detail='var(--ss-surface-hover)', lights='var(--ss-accent)', ground=building, bridge=shade }: {building?:string;shade?:string;detail?:string;lights?:string;ground?:string;bridge?:string}) {
    return <g data-barranco-silhouette>
        <g data-barranco-part="terraced-campus" fill={building}>
            <path data-city-tone="building" d="M68 8h18v5h9v5h9v6h8v12H58V18h10z"/>
            <path fill={shade} d="M63 15h32v2H63zM58 23h46v2H58zM58 31h54v2H58z"/>
            <path fill={detail} d="M68 17h4v6h-4zm12 0h4v6h-4zM64 25h4v6h-4zm14 0h4v6h-4zm14 0h4v6h-4z"/>
            <path fill={lights} opacity=".55" d="M70 21h2v2h-2zm24 8h2v2h-2z"/>
        </g>
        <g data-barranco-part="coastal-slope">
            <path fill={ground} d="M0 44v-3h20v-2h19v-3h17v-2h18v-2h20v-2h34v16H0z"/>
            <path fill={shade} opacity=".5" d="M40 45v-3h8v-3h8v-3h5v3h-6v3h-7v3zM92 45v-3h7v-4h7v-4h5v5h-8v4h-6v2z"/>
        </g>
        <g data-barranco-part="coastal-bridge" fill={bridge}>
            <path d="M2 32h48v3H2zM8 35h3v9H8zm15 0h3v8h-3zm15 0h3v7h-3z"/>
        </g>
        <path fill={building} d="M0 40v-5h7v-3h7v3h6v5z"/>
        <path data-city-tone="star" fill={lights} opacity=".55" d="M25 12h1v3h-1zm-1 1h3v1h-3zM115 7h1v3h-1zm-1 1h3v1h-3z"/>
    </g>;
}
