import { createContext, useCallback, useContext, useLayoutEffect, useRef, useState, type ReactNode, type ComponentRef } from 'react';
import { BackHandler, type ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';

type Action = { label: string; run(): void; hidden: boolean };
export const MenuActionContext = createContext<{ action: Action | null; setAction(action: Action | null): void } | null>(null);
export function MenuActionProvider({ children }: { children: ReactNode }) {
  const [action, setAction] = useState<Action | null>(null);
  return <MenuActionContext.Provider value={{ action, setAction }}>{children}</MenuActionContext.Provider>;
}
export function useCurrentMenuAction() { return useContext(MenuActionContext)?.action ?? null; }
export function useMenuAction(label: string, run: () => void, hidden = false, onBack?: () => void) {
  const context = useContext(MenuActionContext);
  const setAction = context?.setAction;
  const runRef = useRef(run);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const backRef = useRef(onBack);
  useLayoutEffect(() => { runRef.current = run; backRef.current = onBack; });
  const handlesBack = onBack !== undefined;
  useFocusEffect(useCallback(() => {
    setAction?.({ label, run: () => { scrollRef.current?.scrollTo({ y: 0, animated: false }); runRef.current(); }, hidden });
    const back = hidden && handlesBack ? BackHandler.addEventListener('hardwareBackPress', () => {
      backRef.current?.(); return true;
    }) : null;
    return () => { back?.remove(); setAction?.(null); };
  }, [label, hidden, setAction, handlesBack]));
  return scrollRef;
}
