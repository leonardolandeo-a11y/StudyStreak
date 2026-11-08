import { createContext } from 'react';
import type { AppearanceStore } from '../features/appearance/appearanceStore';

export type AppearanceValue = ReturnType<AppearanceStore['getSnapshot']> &
  Pick<AppearanceStore, 'setPreferences' | 'retryPersistence'>;
export const AppearanceContext = createContext<AppearanceValue | undefined>(undefined);
