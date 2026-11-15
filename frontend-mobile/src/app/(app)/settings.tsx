import { StudyEnvironmentSettings } from '../../components/environment/StudyEnvironmentSettings';
import { useAuth } from '../../hooks/useAuth';
import { AcademicHeading, AcademicPanel as Card } from '../../components/academic/Academic';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { SocialPrivacySettings } from '../../components/social/SocialPrivacySettings';
import { Screen } from '../../components/ui/Screen';
import { ActionButton } from '../../components/ui/ActionButton';
import { StatusMessage } from '../../components/ui/StatusMessage';
import { AppIcon } from '../../components/ui/AppIcon';
import { NavigationPressable } from '../../components/navigation/NavigationPressable';
import { useAppearance, useThemedStyles } from '../../hooks/useAppearance';
import { accentNames, appearanceModes, backgroundNames, createTheme, defaultAppearance, type ThemeColors } from '../../features/appearance/theme';

export default function Settings() {
  const { currentUser } = useAuth();
  const { preferences, theme, systemMotion, persistenceError, setPreferences, retryPersistence } = useAppearance();
  const styles = useThemedStyles(createStyles);
  return <Screen themed compact>
    <AcademicHeading title="Appearance" eyebrow="SETTINGS" glyph="gear" />
    <Card style={styles.section}>
      <Text accessibilityRole="header" style={styles.heading}>Theme</Text>
      <View style={styles.choices}>
        {appearanceModes.map(mode => <AppearanceChoice key={mode} label={label(mode)} selected={preferences.mode === mode}
          onPress={() => { void setPreferences({ mode }); }} color={createTheme({ ...preferences, mode }, theme.mode).colors.background}>
          {mode === 'system' ? <AppIcon name="device" size={28} color={theme.colors.textSecondary} /> : null}
        </AppearanceChoice>)}
      </View>
      {preferences.mode === 'system' ? <Text style={styles.description}>Follows your device appearance.</Text> : null}
    </Card>
    <Card style={styles.section}>
      <Text accessibilityRole="header" style={styles.heading}>Background theme</Text>
      <Text style={styles.description}>Light and dark previews. Your accent stays independent.</Text>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {backgroundNames.map(background => <NavigationPressable key={background} accessibilityRole="radio"
          accessibilityLabel={`${label(background)} background`} aria-checked={preferences.background === background} accessibilityState={{ checked: preferences.background === background }}
          onPress={() => { void setPreferences({ background }); }}
          style={({ pressed }) => ({ minWidth: 110, flexGrow: 1, flexBasis: '30%', minHeight: 84, padding: 10, gap: 8,
            borderRadius: 10, borderWidth: preferences.background === background ? 2 : 1,
            borderColor: preferences.background === background ? theme.colors.primary : theme.colors.border,
            backgroundColor: theme.colors.surfaceRaised, opacity: pressed ? .7 : 1 })}>
          <View accessible={false} style={{ flexDirection: 'row', gap: 4 }}>
            {(['light', 'dark'] as const).map(mode => {
              const sample = createTheme({ ...preferences, background, mode }, mode).colors;
              return <View key={mode} testID={`background-preview-${background}-${mode}`} style={{ flex: 1, height: 26,
                borderRadius: 4, borderWidth: 1, borderColor: sample.borderStrong, backgroundColor: sample.background }}>
                <View style={{ margin: 4, height: 16, backgroundColor: sample.surface, borderRadius: 2 }} />
              </View>;
            })}
          </View>
          <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '600' }}>{label(background)}{preferences.background === background ? ' ✓' : ''}</Text>
        </NavigationPressable>)}
      </View>
    </Card>
    <Card style={styles.section}>
      <Text accessibilityRole="header" style={styles.heading}>Accent palette</Text>
      <View style={styles.choices}>
        {accentNames.map(accent => <AppearanceChoice key={accent} label={label(accent)} selected={preferences.accent === accent} compact
          color={createTheme({ ...preferences, accent }, theme.mode).colors.primary}
          onPress={() => { void setPreferences({ accent }); }} />)}
      </View>
    </Card>
    {currentUser ? <StudyEnvironmentSettings key={currentUser.id} userId={currentUser.id}/> : null}
    <Card style={styles.section}>
      <View style={styles.motionRow}>
        <Text style={styles.motionLabel}>Reduce motion</Text>
        <Switch accessibilityLabel="Reduce motion" value={preferences.reduceMotion}
          onValueChange={value => { void setPreferences({ reduceMotion: value }); }}
          trackColor={{ false: theme.colors.borderStrong, true: theme.colors.primary }} />
      </View>
      {systemMotion ? <Text style={styles.description}>Enabled by your device accessibility settings.</Text> : null}
    </Card>
    <NavigationPressable accessibilityRole="button" accessibilityLabel="Restore default appearance"
      onPress={() => { void setPreferences(defaultAppearance); }} style={styles.restore}>
      <Text style={styles.restoreText}>Restore defaults</Text>
    </NavigationPressable>
    <SocialPrivacySettings />
    {persistenceError ? <View style={styles.recovery}>
      <StatusMessage error message={persistenceError} />
      <ActionButton title="Retry saving appearance" secondary onPress={() => { void retryPersistence(); }} />
    </View> : null}
  </Screen>;
}
function AppearanceChoice({ label, selected, onPress, color, compact = false, children }: {
  label: string; selected: boolean; onPress(): void; color: string; compact?: boolean; children?: React.ReactNode;
}) {
  const { theme } = useAppearance();
  const size = compact ? 36 : 44;
  return <NavigationPressable accessibilityRole="button" accessibilityLabel={label} aria-selected={selected} accessibilityState={{ selected }} onPress={onPress}
    style={({ pressed }) => ({ flex: 1, minHeight: compact ? 68 : 78, alignItems: 'center', justifyContent: 'center', gap: 8,
      borderRadius: 10, opacity: pressed ? .7 : 1 })}>
    <View style={{ width: size, height: size, borderRadius: 8, borderWidth: 1, borderColor: theme.colors.borderStrong,
      backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      {children}
      {selected ? <View style={{ position: 'absolute', right: -5, bottom: -5, width: 19, height: 19, borderRadius: 10,
        backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' }}>
        <Text accessible={false} style={{ color: theme.colors.primaryText, fontSize: 12, fontWeight: '700' }}>✓</Text>
      </View> : null}
    </View>
    <Text style={{ color: selected ? theme.colors.text : theme.colors.muted, fontSize: 12, fontWeight: selected ? '600' : '400' }}>{label}</Text>
  </NavigationPressable>;
}
function label(value: string) { return value[0].toUpperCase() + value.slice(1); }
const createStyles = (palette: ThemeColors) => StyleSheet.create({
  title: { color: palette.text, fontSize: 24, fontWeight: '700' },
  section: { padding: 16, gap: 12 },
  heading: { color: palette.text, fontSize: 16, fontWeight: '600' },
  description: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  choices: { flexDirection: 'row', gap: 6 },
  motionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  motionLabel: { color: palette.text, fontSize: 15, flex: 1 },
  restore: { minHeight: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  restoreText: { color: palette.primary, fontSize: 14 },
  recovery: { gap: 12 },
});
