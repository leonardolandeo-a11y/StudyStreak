import type { ReactNode, Ref, ComponentRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSegments } from 'expo-router';
import { useAppearance } from '../../hooks/useAppearance';
import { useCurrentMenuAction } from '../../contexts/MenuActionContext';

export function Screen({ children, scroll = true, themed: _themed = true, scrollRef, onRefresh, refreshing = false, compact = false, backgroundColor }: {
  children: ReactNode; scroll?: boolean; themed?: boolean; scrollRef?: Ref<ComponentRef<typeof ScrollView>>;
  onRefresh?: () => void; refreshing?: boolean;
  compact?: boolean; backgroundColor?: string;
}) {
  const { theme } = useAppearance();
  const segments = useSegments();
  const action = useCurrentMenuAction();
  const hasTabBar = segments.some(segment => segment === '(menu)') && !action?.hidden;
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: backgroundColor ?? theme.colors.background }]}
      edges={segments[0] === '(app)' ? hasTabBar ? [] : ['bottom'] : ['top', 'bottom']}>
      {scroll ? (
        <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            tintColor={theme.colors.primary} colors={[theme.colors.primary]} /> : undefined}
          automaticallyAdjustKeyboardInsets contentContainerStyle={[styles.body, compact && styles.compact]}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.body, compact && styles.compact]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: { flexGrow: 1, paddingHorizontal: 18, paddingVertical: 28, gap: 18, width: '100%', maxWidth: 760, alignSelf: 'center' },
  compact: { paddingVertical: 16, gap: 16 },
});
