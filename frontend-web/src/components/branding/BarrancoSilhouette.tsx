/** Flat, coarse pixel landscape. The 128 × 46 footprint is shared by the window and sidebar. */
export function BarrancoSilhouette({ building='var(--sidebar-city-building, var(--ss-border-strong))', shade='var(--ss-text-muted)', detail='var(--ss-surface-hover)', lights='var(--ss-accent)', ground='color-mix(in srgb, var(--ss-border-strong) 60%, #64815a)', bridge='color-mix(in srgb, var(--ss-border-strong) 65%, #c4ab80)', water='color-mix(in srgb, var(--ss-border-strong) 65%, #528c99)' }: {building?:string;shade?:string;detail?:string;lights?:string;ground?:string;bridge?:string;water?:string}) {
    return <g data-barranco-silhouette>
        {/* Distant coast: a low skyline leaves the sky and facade readable. */}
        <path data-coastal-city fill={shade} opacity=".5" d="M0 33v-4h5v-3h5v3h5v-6h6v7h5v-4h4v3h6v-8h7v9h7v-4h6v3h8v6H0z"/>
        <path data-coastal-water fill={water} d="M0 33h128v13H0z"/>
        <path fill={detail} opacity=".4" d="M2 36h14v1H2zm7 3h11v1H9zM0 43h14v1H0zm20 1h15v1H20z"/>
        {/* One inclined facade, large structural openings; no stacked floor slabs. */}
        <g data-barranco-part="terraced-campus" data-campus-form="inclined-facade" fill={building}>
            <path data-city-tone="building" d="M72 16h7v-2h8v-2h9v-2h7v23H72z"/>
            <path fill={shade} opacity=".75" d="M103 10h3v4h3v4h3v4h3v4h3v7h-15z"/>
            <path fill={shade} d="M75 18h5v6h-5zm8-2h5v8h-5zm8-2h6v10h-6zM75 26h5v6h-5zm8 0h5v6h-5zm8 0h6v6h-6z"/>
            <path fill={detail} opacity=".65" d="M76 19h3v1h-3zm8-2h3v1h-3zm8-2h4v1h-4zM76 27h3v1h-3zm8 0h3v1h-3zm8 0h4v1h-4z"/>
            <path fill={lights} opacity=".6" d="M84 29h2v2h-2zm9-8h2v2h-2z"/>
        </g>
        <g data-barranco-part="coastal-slope">
            <path fill={ground} d="M25 44v-3h8v-3h10v-3h12v-2h15v-2h20v-2h17v-2h21v19H25z"/>
            <path fill={shade} opacity=".4" d="M30 44v-3h8v-3h8v-3h8v-2h8v3h-8v3h-8v3h-8v2zM74 44v-3h8v-3h8v-3h8v-3h6v3h-8v3h-8v3h-8v3z"/>
            <path fill={detail} opacity=".25" d="M50 37h12v-2h12v-2h11v2H73v2H61v2H50zM98 40h10v-3h12v-3h8v4h-10v3h-10v3H98z"/>
            {/* Pixel shrubs and a small tree anchor the campus to its slope. */}
            <path fill={ground} d="M61 32v-5h-3v-3h4v-2h5v3h3v4h-4v5zM107 29v-5h4v-2h6v3h4v4zM119 26v-5h4v-3h5v8zM46 34v-3h4v-2h4v3h4v3z"/>
            <path fill={bridge} d="M64 29h1v5h-1z"/>
            <path fill={building} d="M95 42v-4h8v5h-8zm12 0v-6h9v6h-9zm12-2v-6h9v6z"/>
            <path fill={shade} d="M97 39h2v1h-2zm12-1h2v1h-2zm5 0h1v1h-1zm7-2h2v1h-2z"/>
        </g>
        <g data-barranco-part="coastal-bridge" fill={bridge}>
            <path d="M0 31h73v2H0zM9 33h3v8H9zm16 0h3v7h-3zm16 0h3v5h-3zm16 0h3v3h-3z"/>
            <path fill={shade} opacity=".5" d="M0 33h73v1H0z"/>
        </g>
        <path data-city-tone="star" fill={lights} opacity=".55" d="M25 12h1v3h-1zm-1 1h3v1h-3zM115 7h1v3h-1zm-1 1h3v1h-3z"/>
    </g>;
}
