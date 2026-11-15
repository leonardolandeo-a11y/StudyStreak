export const appearanceModes = ['dark', 'light', 'system'] as const;
export const accentNames = ['mint', 'blue', 'purple', 'orange'] as const;
export const backgroundNames = ['neutral', 'lavender', 'sage', 'amber', 'sky'] as const;
export type BackgroundName = typeof backgroundNames[number];
export type AppearanceMode = typeof appearanceModes[number];
export type AccentName = typeof accentNames[number];
export type ColorScheme = 'dark' | 'light';
export interface AppearancePreferences { mode: AppearanceMode; background: BackgroundName; accent: AccentName; reduceMotion: boolean; }
export const defaultAppearance: Readonly<AppearancePreferences> = { mode: 'system', background: 'neutral', accent: 'mint', reduceMotion: false };

export function parseAppearance(value: string | null): AppearancePreferences {
  try {
    const data: unknown = value ? JSON.parse(value) : null;
    if (!data || typeof data !== 'object' || Array.isArray(data)) return { ...defaultAppearance };
    const input = data as Record<string, unknown>;
    return {
      mode: appearanceModes.includes(input.mode as AppearanceMode) ? input.mode as AppearanceMode : 'system',
      background: backgroundNames.includes(input.background as BackgroundName) ? input.background as BackgroundName : 'neutral',
      accent: accentNames.includes(input.accent as AccentName) ? input.accent as AccentName : 'mint',
      reduceMotion: input.reduceMotion === true,
    };
  } catch { return { ...defaultAppearance }; }
}

// Values match the approved Web background families; accents remain independent.
export const backgroundColors = {
  neutral: {
    light: { background: '#f8fafc', surface: '#ffffff', surfaceRaised: '#f9fafb', surfaceHover: '#e8ebf0', border: '#cbd5e1', borderStrong: '#64748b', text: '#0f172a', textSecondary: '#334155', muted: '#475569' },
    dark: { background: '#20242a', surface: '#2b3038', surfaceRaised: '#303741', surfaceHover: '#353c46', border: '#4a5360', borderStrong: '#929dac', text: '#f1f5f9', textSecondary: '#d2dae6', muted: '#c0c8d4' },
  },
  lavender: {
    light: { background: '#f4f1f8', surface: '#ffffff', surfaceRaised: '#f9f6fc', surfaceHover: '#eee8f5', border: '#d8cce4', borderStrong: '#887099', text: '#0f172a', textSecondary: '#4b3e5c', muted: '#61536e' },
    dark: { background: '#211b30', surface: '#342a47', surfaceRaised: '#3b304d', surfaceHover: '#453653', border: '#655078', borderStrong: '#9d85b4', text: '#f1f5f9', textSecondary: '#dfd4e9', muted: '#c1b2cf' },
  },
  sage: {
    light: { background: '#f0f5ef', surface: '#fbfdf9', surfaceRaised: '#f5f9f2', surfaceHover: '#e1ebe0', border: '#c0d2bf', borderStrong: '#647d66', text: '#192a20', textSecondary: '#344e3c', muted: '#506657' },
    dark: { background: '#1d2a26', surface: '#293b33', surfaceRaised: '#304338', surfaceHover: '#354b40', border: '#526c5c', borderStrong: '#9ab5a2', text: '#f0f7f1', textSecondary: '#d6e4d9', muted: '#b7cebf' },
  },
  amber: {
    light: { background: '#fff7ed', surface: '#fffcf7', surfaceRaised: '#fff9f0', surfaceHover: '#f6e9d7', border: '#ddc9ae', borderStrong: '#967750', text: '#302317', textSecondary: '#58412d', muted: '#73583c' },
    dark: { background: '#30241d', surface: '#403127', surfaceRaised: '#49382c', surfaceHover: '#4f3e31', border: '#755b45', borderStrong: '#c4a889', text: '#fff4e8', textSecondary: '#f0ddc8', muted: '#dec5aa' },
  },
  sky: {
    light: { background: '#eef5fb', surface: '#fbfdff', surfaceRaised: '#f5faff', surfaceHover: '#dfebf7', border: '#bfd0e3', borderStrong: '#647f9e', text: '#172b44', textSecondary: '#354e6b', muted: '#496079' },
    dark: { background: '#1e2937', surface: '#2a3a4e', surfaceRaised: '#304159', surfaceHover: '#34485f', border: '#536c89', borderStrong: '#a0b7d2', text: '#f2f7ff', textSecondary: '#d9e7f7', muted: '#bed0e6' },
  },
} as const;

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
  const family = backgroundColors[preferences.background ?? 'neutral'][mode];
  return {
    mode,
    colors: {
      ...family,
      overlay: '#00000066', shadow: '#000000',
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
