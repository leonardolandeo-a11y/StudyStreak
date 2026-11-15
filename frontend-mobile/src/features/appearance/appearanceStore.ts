import { createTheme, defaultAppearance, parseAppearance, type AppearancePreferences, type ColorScheme } from './theme';

export interface AppearanceStorage { read(): Promise<string | null>; write(value: string): Promise<void>; }
export interface AppearanceEnvironment {
  getScheme(): ColorScheme | null;
  getReducedMotion(): Promise<boolean>;
  onSchemeChange(listener: (scheme: ColorScheme | null) => void): () => void;
  onMotionChange(listener: (enabled: boolean) => void): () => void;
}

export function createAppearanceStore(storage: AppearanceStorage) {
  let preferences: AppearancePreferences = { ...defaultAppearance };
  let scheme: ColorScheme | null = null;
  let systemMotion = false;
  let ready = false;
  let persistenceError: string | null = null;
  let edits = 0;
  let writeTask = Promise.resolve();
  let writeRevision = 0;
  const listeners = new Set<() => void>();
  const snapshot = () => ({ preferences, theme: createTheme(preferences, scheme),
    reduceMotion: preferences.reduceMotion || systemMotion, systemMotion, ready, persistenceError });
  let state = snapshot();
  const publish = () => { state = snapshot(); listeners.forEach(listener => listener()); };
  const persist = () => {
    const revision = ++writeRevision;
    // Persist only presentation, never account, tokens, privacy or Focus state.
    const value = JSON.stringify(preferences);
    writeTask = writeTask.catch(() => {}).then(() => storage.write(value)).then(() => {
      if (revision === writeRevision) { persistenceError = null; publish(); }
    }).catch(() => {
      if (revision === writeRevision) {
        persistenceError = 'Appearance works for now, but could not be saved on this device.';
        publish();
      }
    });
    return writeTask;
  };
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    setPreferences(patch: Partial<AppearancePreferences>) {
      preferences = parseAppearance(JSON.stringify({ ...preferences, ...patch }));
      edits++; publish();
      return persist();
    },
    retryPersistence: persist,
    connect(environment: AppearanceEnvironment) {
      let active = true;
      let motionEvents = 0;
      scheme = environment.getScheme();
      publish();
      const stopScheme = environment.onSchemeChange(value => { if (active) { scheme = value; publish(); } });
      const stopMotion = environment.onMotionChange(value => { if (active) { motionEvents++; systemMotion = value; publish(); } });
      const motion = environment.getReducedMotion().then(value => {
        if (active && motionEvents === 0) { systemMotion = value; publish(); }
      }).catch(() => { if (active) { systemMotion = true; publish(); } });
      const revision = edits;
      const reading = storage.read().then(value => {
        if (active && edits === revision) preferences = parseAppearance(value);
      }).catch(() => {
        if (active) persistenceError = 'Saved appearance could not be read. You can choose it again.';
      });
      // Do not show navigable screens before the device motion preference is known.
      void Promise.all([reading, motion]).finally(() => { if (active) { ready = true; publish(); } });
      return () => { active = false; stopScheme(); stopMotion(); };
    },
  };
}
export type AppearanceStore = ReturnType<typeof createAppearanceStore>;
