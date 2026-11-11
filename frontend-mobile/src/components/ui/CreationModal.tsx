import { PixelGlyph } from '../academic/Academic';
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppearance } from '../../hooks/useAppearance';
import { NavigationPressable } from '../navigation/NavigationPressable';
import { AppIcon } from './AppIcon';

type Flow = { registerBack(run: () => void): () => void; lockClose(): () => void; complete(): void };
const FlowContext = createContext<Flow | null>(null);
export function useCreationBack(run: () => void, active: boolean) {
  const context = useContext(FlowContext);
  const latest = useRef(run);
  useLayoutEffect(() => { latest.current = run; });
  useEffect(() => active ? context?.registerBack(() => latest.current()) : undefined, [active, context]);
}
export function useCreationBusy(busy: boolean) {
  const context = useContext(FlowContext);
  useEffect(() => busy ? context?.lockClose() : undefined, [busy, context]);
}
export function useCreationComplete() { return useContext(FlowContext)?.complete; }
export function CreationModal({ visible, title, busy = false, onClose, onBack, onComplete, children, cancelLabel = 'Cancel creation', showBack = true }: {
  visible: boolean; title: string; busy?: boolean; onClose(): void; onBack?: () => void; onComplete?: () => void; children: ReactNode;
  cancelLabel?: string; showBack?: boolean;
}) {
  const { theme, reduceMotion } = useAppearance();
  const handlers = useRef<{ run(): void }[]>([]);
  const [locks, setLocks] = useState(0);
  const completeRef = useRef(onComplete);
  useLayoutEffect(() => { completeRef.current = onComplete; });
  const complete = useCallback(() => completeRef.current?.(), []);
  const registerBack = useCallback((run: () => void) => {
    const entry = { run }; handlers.current.push(entry);
    return () => { handlers.current = handlers.current.filter(value => value !== entry); };
  }, []);
  const lockClose = useCallback(() => { setLocks(value => value + 1); return () => setLocks(value => value - 1); }, []);
  const context = useMemo(() => ({ registerBack, lockClose, complete }), [registerBack, lockClose, complete]);
  const locked = busy || locks > 0;
  const back = () => {
    if (locked) return;
    const current = handlers.current.at(-1);
    if (current) current.run(); else (onBack ?? onClose)();
  };
  return <Modal visible={visible} animationType={reduceMotion ? 'none' : 'slide'} presentationStyle="fullScreen"
    onRequestClose={back}>
    {visible ? <FlowContext.Provider value={context}>
      <SafeAreaView accessibilityViewIsModal style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8,
          minHeight: 56, borderBottomWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface }}>
          {showBack ? <NavigationPressable accessibilityRole="button" accessibilityLabel="Back" disabled={locked} onPress={back}
            style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>
            <AppIcon name="back" color={theme.colors.text} />
          </NavigationPressable> : null}
          <PixelGlyph name="note" size={20} />
          <Text accessibilityRole="header" style={{ flex: 1, color: theme.colors.text, fontSize: 18, fontWeight: '600' }}>{title}</Text>
          <NavigationPressable accessibilityRole="button" accessibilityLabel={cancelLabel} disabled={locked}
            onPress={onClose} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>
            <AppIcon name="close" color={theme.colors.muted} size={20} />
          </NavigationPressable>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets keyboardDismissMode="on-drag"
          contentContainerStyle={{ width: '100%', maxWidth: 760, alignSelf: 'center', padding: 18, gap: 16, paddingBottom: 32 }}>
          {children}
        </ScrollView>
      </SafeAreaView>
    </FlowContext.Provider> : null}
  </Modal>;
}
