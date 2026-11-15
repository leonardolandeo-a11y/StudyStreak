import { useContext, useMemo } from 'react';
import { AppearanceContext } from '../contexts/AppearanceContext';
import type { ThemeColors } from '../features/appearance/theme';

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) throw new Error('useAppearance must be used inside AppearanceProvider');
  return context;
}
export function useThemedStyles<T>(factory: (colors: ThemeColors) => T): T {
  const { theme } = useAppearance();
  return useMemo(() => factory(theme.colors), [factory, theme.colors]);
}
