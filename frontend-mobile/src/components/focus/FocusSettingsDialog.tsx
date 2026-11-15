import { useState } from 'react';
import { Switch, Text, View } from 'react-native';
import type { PomodoroPreferences } from '../../features/focus/pomodoroState';
import { useAppearance } from '../../hooks/useAppearance';
import { CreationModal } from '../ui/CreationModal';
import { ActionButton } from '../ui/ActionButton';
import { NavigationPressable } from '../navigation/NavigationPressable';

export function FocusSettingsDialog({ preferences, locked, onSave, onClose }: {
  preferences: PomodoroPreferences; locked: boolean; onSave(value: PomodoroPreferences): void; onClose(): void;
}) {
  const { theme } = useAppearance();
  const [draft, setDraft] = useState(() => ({ ...preferences }));
  return <CreationModal visible showBack={false} title="Focus settings" cancelLabel="Close Focus settings" onClose={onClose}>
    <Text accessibilityRole="header" style={{ color: theme.colors.text, fontWeight: '600', fontSize: 16 }}>Pomodoro intervals</Text>
    {([{ key: 'focusMinutes', label: 'Focus', min: 5, max: 120 }, { key: 'shortBreakMinutes', label: 'Short break', min: 1, max: 30 },
      { key: 'longBreakMinutes', label: 'Long break', min: 5, max: 60 }] as const).map(field => <View key={field.key}
      style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <Text style={{ color: theme.colors.text, fontSize: 14 }}>{field.label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <NavigationPressable accessibilityRole="button" accessibilityLabel={`Decrease ${field.label}`} disabled={locked || draft[field.key] <= field.min}
          onPress={() => setDraft(value => ({ ...value, [field.key]: Math.max(field.min, value[field.key] - 1) }))}
          style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 10, opacity: locked ? .4 : 1, backgroundColor: theme.colors.surfaceRaised }}>
          <Text style={{ color: theme.colors.text, fontSize: 20 }}>−</Text>
        </NavigationPressable>
        <Text style={{ color: theme.colors.text, fontSize: 14 }}>{draft[field.key]} min</Text>
        <NavigationPressable accessibilityRole="button" accessibilityLabel={`Increase ${field.label}`} disabled={locked || draft[field.key] >= field.max}
          onPress={() => setDraft(value => ({ ...value, [field.key]: Math.min(field.max, value[field.key] + 1) }))}
          style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 10, opacity: locked ? .4 : 1, backgroundColor: theme.colors.surfaceRaised }}>
          <Text style={{ color: theme.colors.text, fontSize: 20 }}>+</Text>
        </NavigationPressable>
      </View>
    </View>)}
    <Text style={{ color: theme.colors.muted, fontSize: 12 }}>{locked ? 'Reset or complete the current session before changing intervals.' : 'A long break follows every four local focus cycles.'}</Text>
    <Text accessibilityRole="header" style={{ color: theme.colors.text, fontWeight: '600', fontSize: 16 }}>Audio · {Math.round(draft.volume * 100)}%</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
      {[0, .25, .5, .75, 1].map(volume => <NavigationPressable key={volume} accessibilityRole="button" accessibilityLabel={`Volume ${volume * 100} percent`}
        accessibilityState={{ selected: draft.volume === volume }} onPress={() => setDraft(value => ({ ...value, volume }))}
        style={{ minWidth: 48, minHeight: 48, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center', borderRadius: 10,
          backgroundColor: draft.volume === volume ? theme.colors.primarySoft : theme.colors.surfaceRaised }}>
        <Text style={{ color: theme.colors.text, fontSize: 13 }}>{volume * 100}%</Text>
      </NavigationPressable>)}
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Text style={{ color: theme.colors.text, flex: 1 }}>Session sound effects</Text>
      <Switch accessibilityLabel="Session sound effects" value={draft.soundEffects} onValueChange={soundEffects => setDraft(value => ({ ...value, soundEffects }))} />
    </View>
    <ActionButton title="Save Focus settings" onPress={() => onSave(draft)} />
    <ActionButton title="Cancel" secondary onPress={onClose} />
  </CreationModal>;
}
