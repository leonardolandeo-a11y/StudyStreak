import { StyleSheet, Switch, Text, View } from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { Card } from '../../components/ui/Card';
import { PageHeading } from '../../components/ui/PageHeading';
import { ActionButton } from '../../components/ui/ActionButton';
import { StatusMessage } from '../../components/ui/StatusMessage';
import { useAppearance, useThemedStyles } from '../../hooks/useAppearance';
import { accentNames, appearanceModes, createTheme, defaultAppearance, type ThemeColors } from '../../features/appearance/theme';

export default function Settings() {
  const { preferences, theme, systemMotion, reduceMotion, persistenceError, setPreferences, retryPersistence } = useAppearance();
  const styles = useThemedStyles(createStyles);
  return <Screen themed>
    <PageHeading title="Appearance" description="Make StudyStreak feel at home on your device." />
    <Card>
      <Text accessibilityRole="header" style={styles.heading}>Theme</Text>
      <View style={styles.choices}>
        {appearanceModes.map(mode => <View key={mode} style={styles.mode}>
          <ActionButton title={`${preferences.mode === mode ? '✓ ' : ''}${label(mode)}`} secondary
            selected={preferences.mode === mode} onPress={() => { void setPreferences({ mode }); }} />
        </View>)}
      </View>
      <Text style={styles.description}>{preferences.mode === 'system'
        ? `Following your device — currently ${theme.mode}.` : 'Your selected theme stays the same when the device theme changes.'}</Text>
    </Card>
    <Card>
      <Text accessibilityRole="header" style={styles.heading}>Accent palette</Text>
      <View style={styles.choices}>
        {accentNames.map(accent => <View key={accent} style={styles.accent}>
          <View accessible={false} style={[styles.swatch, { backgroundColor: createTheme({ ...preferences, accent }, theme.mode).colors.primary }]} />
          <ActionButton title={`${preferences.accent === accent ? '✓ ' : ''}${label(accent)}`} secondary
            selected={preferences.accent === accent} onPress={() => { void setPreferences({ accent }); }} />
        </View>)}
      </View>
    </Card>
    <Card>
      <View style={styles.motionRow}>
        <Text style={styles.motionLabel}>Reduce motion</Text>
        <Switch accessibilityLabel="Reduce motion" value={preferences.reduceMotion}
          onValueChange={value => { void setPreferences({ reduceMotion: value }); }}
          trackColor={{ false: theme.colors.borderStrong, true: theme.colors.primary }} />
      </View>
      <Text style={styles.description}>{systemMotion
        ? 'Your device requests reduced motion. It stays active even when this switch is off.'
        : 'Limit navigation animations. Your device accessibility preference is always respected.'}</Text>
      <Text style={styles.description}>Effective motion: {reduceMotion ? 'Reduced' : 'Standard'}</Text>
    </Card>
    <Card>
      <Text accessibilityRole="header" style={styles.heading}>Live preview</Text>
      <Text style={styles.description}>Your new theme is already applied. Appearance stays local to this device.</Text>
      <StatusMessage variant="success" message="Ready for your next study session." />
      <ActionButton title="Restore default appearance" onPress={() => { void setPreferences(defaultAppearance); }} />
    </Card>
    {persistenceError ? <View style={styles.recovery}>
      <StatusMessage error message={persistenceError} />
      <ActionButton title="Retry saving appearance" secondary onPress={() => { void retryPersistence(); }} />
    </View> : null}
  </Screen>;
}
function label(value: string) { return value[0].toUpperCase() + value.slice(1); }
const createStyles = (palette: ThemeColors) => StyleSheet.create({
  heading: { color: palette.text, fontSize: 18, fontWeight: '700' },
  description: { color: palette.muted, fontSize: 14, lineHeight: 22 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  mode: { flexGrow: 1, flexBasis: 90 },
  accent: { flexGrow: 1, flexBasis: '40%', gap: 8 },
  swatch: { height: 10, borderRadius: 12 },
  motionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  motionLabel: { color: palette.text, fontSize: 16, fontWeight: '600', flex: 1 },
  recovery: { gap: 12 },
});
