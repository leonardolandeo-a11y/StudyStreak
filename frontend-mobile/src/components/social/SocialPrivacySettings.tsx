import { Switch, Text, View } from 'react-native';
import { useSocialPrivacy } from '../../contexts/SocialContext';
import { useAppearance } from '../../hooks/useAppearance';
import { StatusMessage } from '../ui/StatusMessage';
import { ActionButton } from '../ui/ActionButton';
const options = [
  { key: 'showPresence', label: 'Show online status', hint: 'Let accepted Tracking partners see Online or Offline.' },
  { key: 'showLastSeen', label: 'Share last activity', hint: 'Share the last activity confirmed by the server.' },
  { key: 'shareVerifiedMinutes', label: 'Share verified minutes', hint: 'Share lifetime confirmed study minutes.' },
  { key: 'shareVerifiedSessions', label: 'Share verified sessions', hint: 'Share lifetime completed, verified sessions.' },
] as const;
export function SocialPrivacySettings() {
  const { state, session } = useSocialPrivacy();
  const { theme: { colors } } = useAppearance();
  const busy = !state?.privacy || state.loading || state.saving;
  return <View style={{ gap: 8, paddingTop: 8 }}>
    <Text accessibilityRole="header" style={{ color: colors.text, fontWeight: '600', fontSize: 20 }}>Social privacy</Text>
    <Text style={{ color: colors.muted, fontSize: 12 }}>These preferences are saved to your account, separately from local appearance.</Text>
    {!state || state.loading ? <StatusMessage message="Loading social privacy…" /> : null}
    {options.map(option => <View key={option.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64,
      paddingVertical: 8, borderBottomWidth: 1, borderColor: colors.border }}>
      <View style={{ flex: 1, gap: 3 }}><Text style={{ color: colors.text, fontSize: 14 }}>{option.label}</Text>
        <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 17 }}>{option.hint}</Text></View>
      <Switch accessibilityLabel={option.label} disabled={busy} value={state?.privacy?.[option.key] ?? false}
        onValueChange={value => { if (state?.privacy) void session?.save({ ...state.privacy, [option.key]: value }); }}
        trackColor={{ false: colors.borderStrong, true: colors.primary }} />
    </View>)}
    {state?.saving ? <StatusMessage message="Saving social privacy…" /> : state?.saved ? <StatusMessage variant="success" message="Social privacy saved." /> : null}
    {state?.error ? <><StatusMessage error message={state.error} /><ActionButton title="Retry social privacy" secondary onPress={() => { void session?.load(); }} /></> : null}
  </View>;
}
