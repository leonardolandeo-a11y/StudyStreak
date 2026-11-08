export const appearanceModes = ['dark', 'light', 'system'] as const;
export const accentNames = ['mint', 'blue', 'purple', 'orange'] as const;
export type AppearanceMode = typeof appearanceModes[number];
export type AccentName = typeof accentNames[number];
export type ColorScheme = 'dark' | 'light';
export interface AppearancePreferences { mode: AppearanceMode; accent: AccentName; reduceMotion: boolean; }
export const defaultAppearance: Readonly<AppearancePreferences> = { mode: 'dark', accent: 'mint', reduceMotion: false };

export function parseAppearance(value: string | null): AppearancePreferences {
  try {
    const data: unknown = value ? JSON.parse(value) : null;
    if (!data || typeof data !== 'object') return { ...defaultAppearance };
    const input = data as Record<string, unknown>;
    return {
      mode: appearanceModes.includes(input.mode as AppearanceMode) ? input.mode as AppearanceMode : 'dark',
      accent: accentNames.includes(input.accent as AccentName) ? input.accent as AccentName : 'mint',
      reduceMotion: input.reduceMotion === true,
    };
  } catch { return { ...defaultAppearance }; }
}

// Semantic equivalents of Web tokens.css; native sizing and system typography.
const accents = {
  mint: { light: ['#126449', '#0e503b', '#e0f5eb'], dark: ['#94e8c3', '#75dab0', '#183b31'] },
  blue: { light: ['#1d4ed8', '#1e40af', '#eff6ff'], dark: ['#93c5fd', '#60a5fa', '#172d49'] },
  purple: { light: ['#6d28d9', '#5b21b6', '#f5f3ff'], dark: ['#d8b4fe', '#c084fc', '#342445'] },
  orange: { light: ['#9a3412', '#7c2d12', '#fff7ed'], dark: ['#fdba74', '#fb923c', '#332317'] },
} as const;

export function createTheme(preferences: AppearancePreferences, systemScheme: ColorScheme | null) {
  const mode = preferences.mode === 'system' ? systemScheme ?? 'dark' : preferences.mode;
  const dark = mode === 'dark';
  const [primary, primaryHover, primarySoft] = accents[preferences.accent][mode];
  return {
    mode,
    colors: {
      background: dark ? '#0b1014' : '#f8fafc', surface: dark ? '#141c22' : '#ffffff',
      surfaceRaised: dark ? '#26323b' : '#e2e8f0', border: dark ? '#26323b' : '#cbd5e1',
      borderStrong: dark ? '#657783' : '#64748b', text: dark ? '#f1f5f9' : '#0f172a',
      textSecondary: dark ? '#cbd5e1' : '#334155', muted: dark ? '#94a3b8' : '#475569',
      primary, primaryHover, primarySoft, primaryText: dark ? '#0b1014' : '#ffffff', focus: primary,
      error: dark ? '#fca5a5' : '#991b1b', errorSurface: dark ? '#2c171b' : '#fff1f2',
      errorBorder: dark ? '#7f1d1d' : '#fda4af', success: dark ? '#86efac' : '#166534',
      successSurface: dark ? '#142b21' : '#f0fdf4', pending: dark ? '#fcd34d' : '#854d0e',
      warningSurface: dark ? '#302611' : '#fefce8', info: dark ? '#7dd3fc' : '#075985',
      infoSurface: dark ? '#142732' : '#f0f9ff',
    },
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
    typography: { caption: 12, label: 14, body: 16, heading: 28, title: 34 },
    radius: { control: 12, panel: 16, pill: 9999 },
    controlHeight: 48,
  };
}
export type AppTheme = ReturnType<typeof createTheme>;
export type ThemeColors = AppTheme['colors'];
