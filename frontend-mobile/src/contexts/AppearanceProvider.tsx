import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { AccessibilityInfo, Appearance } from 'react-native';
import { AppearanceContext } from './AppearanceContext';
import { createAppearanceStore } from '../features/appearance/appearanceStore';
import { appearanceStorage } from '../services/appearanceStorage';

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => createAppearanceStore(appearanceStorage));
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  useEffect(() => store.connect({
    getScheme: () => Appearance.getColorScheme() === 'light' ? 'light' : 'dark',
    getReducedMotion: () => AccessibilityInfo.isReduceMotionEnabled(),
    onSchemeChange(listener) {
      const subscription = Appearance.addChangeListener(({ colorScheme }) => listener(colorScheme === 'light' ? 'light' : 'dark'));
      return () => subscription.remove();
    },
    onMotionChange(listener) {
      const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', listener);
      return () => subscription.remove();
    },
  }), [store]);
  return <AppearanceContext.Provider value={{ ...snapshot, setPreferences: store.setPreferences,
    retryPersistence: store.retryPersistence }}>{children}</AppearanceContext.Provider>;
}
