import { BarrancoSilhouette } from '../branding/BarrancoSilhouette';
/** Local, theme-aware UTEC/Barranco-inspired silhouette within the original footprint. */
export function SidebarSkyline() {
    return <svg data-academic-sprite="skyline" viewBox="0 0 128 46" width={264} height={264 * 46 / 128}
        shapeRendering="crispEdges" aria-hidden="true" focusable="false" className="academic-sprite"><BarrancoSilhouette/></svg>;
}
