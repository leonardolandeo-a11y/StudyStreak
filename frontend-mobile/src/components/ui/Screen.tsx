import type { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, View } from 'react-native';
import { palette } from '../../constants/palette';
import { useSegments } from 'expo-router';
import { useAppearance } from '../../hooks/useAppearance';

// Legacy screens keep their dark canvas until their own fixed text is migrated.
export function Screen({ children, scroll = true, themed = false }: {
  children: ReactNode; scroll?: boolean; themed?: boolean;
}) {
  const { theme } = useAppearance();
  const segments = useSegments();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themed ? theme.colors.background : palette.background }]}
      edges={segments[0] === '(app)' ? ['bottom'] : ['top', 'bottom']}>
      {scroll ? (
        <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets contentContainerStyle={styles.body}>
          {children}
        </ScrollView>
      ) : (
        <View style={styles.body}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  body: { flexGrow: 1, paddingHorizontal: 18, paddingVertical: 28, gap: 18, width: '100%', maxWidth: 760, alignSelf: 'center' },
});
