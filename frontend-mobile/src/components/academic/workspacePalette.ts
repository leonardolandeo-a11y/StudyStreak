import type { AppTheme } from '../../features/appearance/theme';
/** Route-local visual treatment; global appearance and accent selection stay intact. */
export function workspacePalette(theme: AppTheme) {
    const dark = theme.mode === 'dark';
    return { ...theme.colors, background: dark ? '#211b30' : '#f4f1f8', surface: dark ? '#342a47' : '#ffffff',
        surfaceRaised: dark ? '#453653' : '#eee8f5', border: dark ? '#655078' : '#d8cce4',
        borderStrong: dark ? '#9d85b4' : '#887099', muted: dark ? '#c1b2cf' : '#61536e',
        textSecondary: dark ? '#dfd4e9' : '#4b3e5c' };
}
export function metricSurface(index: number, dark: boolean) {
    return (dark ? ['#49345c','#334059','#34464c','#4c334a'] : ['#f2e8f9','#eaf0fa','#e7f2ec','#fae9f0'])[index];
}
