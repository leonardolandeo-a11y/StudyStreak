import type { AppTheme, ThemeColors } from '../../features/appearance/theme';
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

/** Dashboard-only lavender cards: readable ink and selected accent, as in approved Web. */
export function dashboardPalette(theme: AppTheme): ThemeColors {
    const dark = theme.mode === 'dark';
    const accents = {
        '#94e8c3': '#126449', '#93c5fd': '#1d4ed8', '#d8b4fe': '#6d28d9', '#fdba74': '#9a3412',
    } as Record<string, ThemeColors['primary']>;
    return { ...theme.colors, surface: dark ? '#dbc7eb' : '#f3e9f9', surfaceRaised: dark ? '#d1b9e3' : '#eadcf3',
        background: dark ? '#cbb4df' : '#e4d4ef', border: dark ? '#b696cc' : '#cbb2df', borderStrong: '#9570ad',
        text: '#2e1747', textSecondary: '#4c3365', muted: '#634d79', primary: accents[theme.colors.primary] ?? theme.colors.primary,
        primaryText: '#ffffff', primarySoft: '#f5f3ff', focus: accents[theme.colors.primary] ?? theme.colors.focus, info: '#285f8e', infoSurface: dark ? '#d1b9e3' : '#eadcf3',
        error: '#991b1b', errorSurface: '#fff1f2', errorBorder: '#fda4af' };
}
