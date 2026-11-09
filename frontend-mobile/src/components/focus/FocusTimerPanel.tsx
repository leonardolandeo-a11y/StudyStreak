import { useState } from 'react';
import { Text, View } from 'react-native';
import { useAppearance } from '../../hooks/useAppearance';
import type { PomodoroMode } from '../../features/focus/pomodoroState';
import { AcademicPanel as Card, PixelProgress } from '../academic/Academic';
import { ActionButton } from '../ui/ActionButton';
import { AppIcon } from '../ui/AppIcon';
import { NavigationPressable } from '../navigation/NavigationPressable';

export function FocusTimerPanel({ mode, time, progress, running, paused, ready, locked, busy, onMode, onToggle, onReset, onSettings }: {
  mode: PomodoroMode; time: string; progress: number; running: boolean; paused: boolean; ready: boolean; locked: boolean;
  busy: boolean;
  onMode(mode: PomodoroMode): void; onToggle(): void; onReset(): void; onSettings(): void;
}) {
  const { theme } = useAppearance();
  const [diameter, setDiameter] = useState(230);
  return <Card style={{ padding: 16, gap: 14 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: 18, fontWeight: '600' }}>Pomodoro</Text>
      <NavigationPressable accessibilityRole="button" accessibilityLabel="Focus settings" disabled={!ready} onPress={onSettings}
        style={{ width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
        <AppIcon name="settings" color={theme.colors.muted} size={21} />
      </NavigationPressable>
    </View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
      {([{ id: 'focus', label: 'Focus' }, { id: 'shortBreak', label: 'Short break' }, { id: 'longBreak', label: 'Long break' }] as const).map(item =>
        <NavigationPressable key={item.id} accessibilityRole="button" accessibilityLabel={item.label}
          accessibilityState={{ selected: mode === item.id, disabled: !ready || running || locked || busy }} disabled={!ready || running || locked || busy}
          onPress={() => onMode(item.id)} style={{ minHeight: 48, paddingHorizontal: 8, justifyContent: 'center', borderRadius: 10,
            backgroundColor: mode === item.id ? theme.colors.primarySoft : 'transparent' }}>
          <Text style={{ color: mode === item.id ? theme.colors.primary : theme.colors.muted, fontSize: 13 }}>{item.label}</Text>
        </NavigationPressable>)}
    </View>
    <View onLayout={event => setDiameter(Math.min(230, event.nativeEvent.layout.width))} style={{ alignSelf: 'stretch', alignItems: 'center' }}>
    <View testID="pomodoro-circle" style={{ width: diameter, height: diameter, flexShrink: 0, borderRadius: diameter / 2, borderWidth: 3,
      backgroundColor: theme.colors.background, borderColor: running ? theme.colors.primary : theme.colors.borderStrong, alignSelf: 'center', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
      {Array.from({ length: 12 },(_,index) => {
        const angle = index * Math.PI / 6;
        return <View key={index} accessible={false} style={{ position: 'absolute', width: 3, height: 3,
          left: diameter/2 - 4.5 + Math.cos(angle)*(diameter/2 - 10), top: diameter/2 - 4.5 + Math.sin(angle)*(diameter/2 - 10), backgroundColor: theme.colors.muted }} />;
      })}
      <Text style={{ color: theme.colors.muted, fontSize: 12 }}>{mode === 'focus' ? 'DEEP WORK' : 'TAKE A BREAK'}</Text>
      <Text accessibilityLabel={`Time remaining ${time}`} style={{ color: theme.colors.text, fontSize: 50, fontWeight: '700',
        fontVariant: ['tabular-nums'] }}>{time}</Text>
      <Text style={{ color: theme.colors.primary, fontSize: 13 }}>{!ready ? 'Restoring…' : running ? 'In progress' : paused ? 'Paused' : 'Ready'}</Text>
    </View>
    </View>
    <PixelProgress value={Math.round(progress * 100)} label="Session progress" />
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ flex: 1 }}><ActionButton title={running ? 'Pause timer' : paused ? 'Resume session' : mode === 'focus' ? 'Start focus' : 'Start break'}
        disabled={!ready} busy={busy} onPress={onToggle} /></View>
      <NavigationPressable accessibilityRole="button" accessibilityLabel="Reset current session" disabled={!ready || busy} onPress={onReset}
        style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}>
        <Text style={{ color: theme.colors.muted, fontSize: 24 }}>↺</Text>
      </NavigationPressable>
    </View>
  </Card>;
}
