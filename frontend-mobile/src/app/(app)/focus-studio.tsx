import { useCallback, useEffect, useRef, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import {
  AppState, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { useAuth } from '../../hooks/useAuth';
import { palette } from '../../constants/palette';
import { MobileFocusAudio } from '../../features/focus/mobileFocusAudio';
import {
  advancePomodoro, durationMs, formatPomodoroTime, newPomodoro,
  pausePomodoro, remainingPomodoroMs, resetPomodoro, restorePomodoro,
  selectPomodoroMode, startPomodoro, updatePomodoroPreferences,
} from '../../features/focus/pomodoroState';
import type {
  PomodoroMode, PomodoroPreferences, PomodoroState, Soundscape,
} from '../../features/focus/pomodoroState';
import {
  SOUND_CATEGORIES, SOUNDSCAPES, soundscapeById,
} from '../../features/focus/soundscapes';
import type { SoundCategory } from '../../features/focus/soundscapes';

type DurationField = 'focusMinutes' | 'shortBreakMinutes' | 'longBreakMinutes';

const SOUND_COLORS: Record<Soundscape, string> = {
  dream: '#6d4bd3', keys: '#c25c79', classical: '#b7904d',
  lofi: '#765ac7', white: '#718096', pink: '#cc779d', brown: '#977052',
  rain: '#397ab8', forest: '#30785e', ocean: '#286e94',
  cafe: '#9a6439', fireplace: '#aa4e30',
};
const SOUND_SYMBOLS: Record<Soundscape, string> = {
  dream: '☾', keys: '♫', classical: '♬', lofi: '♪', white: '≈', pink: '≈',
  brown: '≋', rain: '☂', forest: '♧', ocean: '≈', cafe: '☕', fireplace: '✦',
};
const MODES: { id: PomodoroMode; label: string }[] = [
  { id: 'focus', label: 'Focus' },
  { id: 'shortBreak', label: 'Short break' },
  { id: 'longBreak', label: 'Long break' },
];
const VOLUME_STEPS = [0, 0.25, 0.5, 0.75, 1];

function AlbumArt({ sound, size = 66 }: { sound: Soundscape; size?: number }) {
  return (
    <View style={[
      styles.albumArt,
      { width: size, height: size, borderRadius: Math.max(12, size * 0.13), backgroundColor: SOUND_COLORS[sound] },
    ]}>
      <View style={[styles.albumRing, {
        width: size * 0.72, height: size * 0.72,
        borderRadius: size / 2,
      }]} />
      <Text style={[styles.albumSymbol, { fontSize: size * 0.37 }]}>{SOUND_SYMBOLS[sound]}</Text>
    </View>
  );
}

function MiniButton({ label, symbol, disabled, onPress }: {
  label: string; symbol: string; disabled?: boolean; onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label}
      disabled={disabled} onPress={onPress} style={[styles.miniButton, disabled && styles.disabled]}>
      <Text style={styles.miniButtonText}>{symbol}</Text>
    </Pressable>
  );
}

function DurationRow({ label, value, min, max, disabled, onChange }: {
  label: string; value: number; min: number; max: number;
  disabled: boolean; onChange: (value: number) => void;
}) {
  return (
    <View style={styles.durationRow}>
      <Text style={styles.durationLabel}>{label}</Text>
      <View style={styles.durationControls}>
        <MiniButton label={`Decrease ${label}`} symbol="−" disabled={disabled || value <= min}
          onPress={() => onChange(Math.max(min, value - 1))} />
        <Text style={styles.durationValue}>{value} min</Text>
        <MiniButton label={`Increase ${label}`} symbol="+" disabled={disabled || value >= max}
          onPress={() => onChange(Math.min(max, value + 1))} />
      </View>
    </View>
  );
}

export default function FocusStudioMobile() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;
  const key = userId ? `focus_studio_v1_${userId}` : '';
  const [timer, setTimer] = useState<PomodoroState>(() => newPomodoro());
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [playing, setPlaying] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [category, setCategory] = useState<SoundCategory | 'all'>('all');
  const audio = useRef<MobileFocusAudio | null>(null);
  const playbackRequest = useRef(0);
  const focused = useRef(false);
  const notifiedAt = useRef<number | null>(null);

  function getAudio(): MobileFocusAudio {
    if (!audio.current) audio.current = new MobileFocusAudio();
    return audio.current;
  }

  useEffect(() => {
    let active = true;
    setReady(false);
    setTimer(newPomodoro());
    const restore = async () => {
      if (!key) return;
      let restored = newPomodoro();
      try {
        const saved = await SecureStore.getItemAsync(key);
        if (saved) restored = restorePomodoro(JSON.parse(saved) as unknown, Date.now());
      } catch {
        // Corrupt/unavailable storage should not prevent opening Focus Studio.
      }
      if (active) {
        notifiedAt.current = restored.lastCompletedAt;
        setTimer(restored);
        setNow(Date.now());
        setReady(true);
      }
    };
    void restore();
    return () => { active = false; };
  }, [key]);

  useEffect(() => {
    if (!ready || !key) return;
    void SecureStore.setItemAsync(key, JSON.stringify(timer)).catch(() => {
      // Storage can fail on some devices; timer remains usable in memory.
    });
  }, [key, timer, ready]);

  useFocusEffect(useCallback(() => {
    focused.current = true;
    const refresh = () => {
      const current = Date.now();
      setNow(current);
      setTimer(previous => advancePomodoro(previous, current));
    };
    refresh();
    const clock = setInterval(refresh, 500);
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });
    return () => {
      focused.current = false;
      clearInterval(clock);
      sub.remove();
      playbackRequest.current++;
      audio.current?.stop();
      setPlaying(false);
      setLoadingAudio(false);
    };
  }, []));

  useEffect(() => {
    if (!ready || !focused.current || timer.lastCompletedAt === null ||
        timer.lastCompletedAt === notifiedAt.current) return;
    notifiedAt.current = timer.lastCompletedAt;
    if (timer.preferences.soundEffects) {
      void getAudio().cue('complete', timer.preferences.volume);
    }
  }, [ready, timer.lastCompletedAt, timer.preferences.soundEffects, timer.preferences.volume]);

  useEffect(() => () => {
    playbackRequest.current++;
    audio.current?.dispose();
    audio.current = null;
  }, []);

  const remaining = remainingPomodoroMs(timer, now);
  const total = durationMs(timer.mode, timer.preferences);
  const progress = total > 0 ? Math.max(0, Math.min(1, 1 - remaining / total)) : 0;
  const running = timer.endsAt !== null;
  const cycle = timer.focusSessions % 4;
  const activeTrack = soundscapeById(timer.preferences.soundscape);
  const shown = SOUNDSCAPES.filter(s => category === 'all' || s.category === category);

  function updatePreferences(changes: Partial<PomodoroPreferences>) {
    setTimer(previous => updatePomodoroPreferences(previous, changes));
  }

  function changeDuration(field: DurationField, value: number) {
    if (running) return;
    updatePreferences({ [field]: value });
  }

  function toggleTimer() {
    if (!ready) return;
    const current = Date.now();
    setNow(current);
    setTimer(previous => running
      ? pausePomodoro(previous, current)
      : startPomodoro(previous, current));
    if (timer.preferences.soundEffects && focused.current) {
      void getAudio().cue(running ? 'pause' : 'start', timer.preferences.volume);
    }
  }

  function stopAudio() {
    playbackRequest.current++;
    audio.current?.stop();
    setPlaying(false);
    setLoadingAudio(false);
  }

  async function chooseSound(sound: Soundscape) {
    if (!ready || !focused.current) return;
    if (sound === timer.preferences.soundscape && (playing || loadingAudio)) {
      stopAudio();
      return;
    }
    const request = ++playbackRequest.current;
    updatePreferences({ soundscape: sound });
    setAudioError(null);
    setLoadingAudio(true);
    const started = await getAudio().play(sound, timer.preferences.volume);
    if (request !== playbackRequest.current || !focused.current) return;
    setLoadingAudio(false);
    setPlaying(started);
    if (!started) setAudioError('Could not play audio on this device. Try a different sound.');
  }

  function changeVolume(value: number) {
    updatePreferences({ volume: value });
    audio.current?.volume(value);
  }

  if (!currentUser) return null;
  return (
    <Screen>
      <Pressable accessibilityRole="button" onPress={() => router.back()}>
        <Text style={styles.back}>‹ Back</Text>
      </Pressable>

      <View style={styles.heading}>
        <Text style={styles.eyebrow}>♫  YOUR PERSONAL LISTENING ROOM</Text>
        <Text style={styles.title}>Focus Studio<Text style={styles.green}>.</Text></Text>
        <Text style={styles.subtitle}>Focus at your pace with a Pomodoro timer and original, relaxing audio.</Text>
      </View>

      <View style={styles.feature}>
        <View style={styles.featureArtwork}>
          <AlbumArt sound={timer.preferences.soundscape} size={124} />
          <View style={styles.featureCopy}>
            <Text style={styles.eyebrow}>NOW PLAYING</Text>
            <Text numberOfLines={2} style={styles.featureTitle}>{activeTrack.title}</Text>
            <Text style={styles.featureType}>{activeTrack.kind}</Text>
            <Text style={styles.miniMuted}>StudyStreak Originals · Offline</Text>
          </View>
        </View>
        <Pressable accessibilityRole="button"
          disabled={!ready || loadingAudio}
          onPress={() => { if (playing) stopAudio(); else void chooseSound(timer.preferences.soundscape); }}
          style={[styles.playButton, (!ready || loadingAudio) && styles.disabled]}>
          <Text style={styles.playButtonText}>
            {loadingAudio ? 'Preparing audio…' : playing ? '❚❚  Pause mix' : '▶  Play mix'}
          </Text>
        </Pressable>
        {audioError ? <Text accessibilityRole="alert" style={styles.error}>{audioError}</Text> : null}
      </View>

      <View style={styles.panel}>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Your session</Text>
          <Text style={styles.runningBadge}>{running ? '● Focusing' : 'Ready to begin'}</Text>
        </View>
        <View style={styles.modeRow}>
          {MODES.map(mode => (
            <Pressable key={mode.id} accessibilityRole="button"
              accessibilityState={{ selected: timer.mode === mode.id, disabled: running || !ready }}
              disabled={running || !ready}
              onPress={() => setTimer(previous => selectPomodoroMode(previous, mode.id))}
              style={[styles.modeButton, timer.mode === mode.id && styles.modeSelected]}>
              <Text style={[styles.modeText, timer.mode === mode.id && styles.modeTextSelected]}>{mode.label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.timerBox}>
          <Text style={styles.timerCaption}>{timer.mode === 'focus' ? 'DEEP WORK' : 'TAKE A BREATH'}</Text>
          <Text style={styles.timerValue}>{formatPomodoroTime(remaining)}</Text>
          <Text style={styles.timerUnder}>{running ? 'STAY IN THE FLOW' : 'READY WHEN YOU ARE'}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` as `${number}%` }]} />
        </View>
        <View style={styles.controls}>
          <Pressable accessibilityRole="button" disabled={!ready} onPress={toggleTimer}
            style={[styles.mainButton, !ready && styles.disabled]}>
            <Text style={styles.mainButtonText}>
              {running ? '❚❚  Pause timer' : remaining < total
                ? '▶  Resume' : timer.mode === 'focus' ? '▶  Start focus' : '▶  Start break'}
            </Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Reset current session" disabled={!ready}
            onPress={() => setTimer(previous => resetPomodoro(previous))}
            style={styles.resetButton}><Text style={styles.resetText}>↺</Text></Pressable>
        </View>
        <View style={styles.sessionFooter}>
          <View style={styles.dots}>
            {[0, 1, 2, 3].map(i => (
              <View key={i} style={[styles.dot, i < cycle && styles.dotCompleted]} />
            ))}
          </View>
          <Text style={styles.miniMuted}>{timer.focusSessions} completed · Long break every 4 sessions</Text>
        </View>
      </View>

      <View style={styles.panel}>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Playback settings</Text>
          <Text style={styles.miniMuted}>{Math.round(timer.preferences.volume * 100)}% volume</Text>
        </View>
        <Text style={styles.fieldLabel}>Volume</Text>
        <View style={styles.volumeRow}>
          {VOLUME_STEPS.map(v => (
            <Pressable key={v} accessibilityRole="button" accessibilityLabel={`Volume ${Math.round(v * 100)} percent`}
              accessibilityState={{ selected: Math.abs(timer.preferences.volume - v) < 0.01 }}
              onPress={() => changeVolume(v)}
              style={[styles.volumeButton, Math.abs(timer.preferences.volume - v) < 0.01 && styles.volumeSelected]}>
              <Text style={[styles.volumeText, Math.abs(timer.preferences.volume - v) < 0.01 && styles.volumeTextSelected]}>
                {Math.round(v * 100)}%
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable accessibilityRole="switch" accessibilityState={{ checked: timer.preferences.soundEffects }}
          onPress={() => updatePreferences({ soundEffects: !timer.preferences.soundEffects })}
          style={styles.soundToggle}>
          <Text style={styles.fieldLabel}>Session sound effects</Text>
          <Text style={styles.toggleValue}>{timer.preferences.soundEffects ? 'ON' : 'OFF'}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => setSettingsOpen(!settingsOpen)}
          style={styles.settingsButton}>
          <Text style={styles.settingsText}>{settingsOpen ? 'Hide' : 'Customize'} Pomodoro intervals</Text>
          <Text style={styles.settingsArrow}>{settingsOpen ? '⌃' : '⌄'}</Text>
        </Pressable>
        {settingsOpen ? (
          <View style={styles.intervalPanel}>
            <DurationRow label="Focus" value={timer.preferences.focusMinutes} min={5} max={120}
              disabled={running} onChange={value => changeDuration('focusMinutes', value)} />
            <DurationRow label="Short break" value={timer.preferences.shortBreakMinutes} min={1} max={30}
              disabled={running} onChange={value => changeDuration('shortBreakMinutes', value)} />
            <DurationRow label="Long break" value={timer.preferences.longBreakMinutes} min={5} max={60}
              disabled={running} onChange={value => changeDuration('longBreakMinutes', value)} />
            <Text style={styles.miniMuted}>Pause the timer before changing an interval.</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.library}>
        <Text style={styles.libraryTitle}>Made for your focus</Text>
        <Text style={styles.subtitle}>Pick a style. Instrumentals, noise colors and peaceful spaces are generated on your device.</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categories} accessibilityLabel="Sound categories">
          {SOUND_CATEGORIES.map(item => (
            <Pressable key={item.id} accessibilityRole="button"
              accessibilityState={{ selected: category === item.id }}
              onPress={() => setCategory(item.id)}
              style={[styles.categoryButton, category === item.id && styles.categorySelected]}>
              <Text style={[styles.categoryText, category === item.id && styles.categoryTextSelected]}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.soundList}>
          {shown.map((item, index) => {
            const isSelected = timer.preferences.soundscape === item.id;
            return (
              <Pressable key={item.id} accessibilityRole="button"
                accessibilityLabel={`Play ${item.title}, ${item.kind}`}
                accessibilityState={{ selected: isSelected }}
                onPress={() => { void chooseSound(item.id); }}
                style={({ pressed }) => [
                  styles.soundRow, isSelected && styles.soundSelected, pressed && styles.pressed,
                ]}>
                <AlbumArt sound={item.id} />
                <View style={styles.soundDetail}>
                  <Text numberOfLines={1} style={styles.soundTitle}>{item.title}</Text>
                  <Text style={styles.soundKind}>{item.kind}</Text>
                  <Text numberOfLines={2} style={styles.soundDescription}>{item.description}</Text>
                </View>
                <Text style={[styles.playSymbol, isSelected && styles.activeSymbol]}>
                  {isSelected && playing ? '❚❚' : '▶'}
                </Text>
                <Text style={styles.soundIndex}>{String(index + 1).padStart(2, '0')}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Text style={styles.footnote}>Sounds are locally synthesized without ads or streaming. Audio stops when you leave Focus Studio, while the timer and preferences remain saved on this device.</Text>
    </Screen>
  );
}

const GREEN = '#4ade80';
const styles = StyleSheet.create({
  back: { color: palette.muted, fontWeight: '700', fontSize: 14 },
  heading: { gap: 8 },
  eyebrow: { color: GREEN, fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  title: { color: palette.text, fontSize: 35, fontWeight: '900', letterSpacing: -1.2 },
  green: { color: GREEN },
  subtitle: { color: '#a7b5c7', fontSize: 14, lineHeight: 21 },
  feature: { backgroundColor: '#123327', borderRadius: 24, padding: 18, gap: 18,
    borderWidth: 1, borderColor: '#23573f' },
  featureArtwork: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  albumArt: { justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  albumRing: { position: 'absolute', borderWidth: 1, borderColor: '#ffffff44' },
  albumSymbol: { color: '#fff', fontWeight: '600' },
  featureCopy: { flex: 1, gap: 5, minWidth: 0 },
  featureTitle: { color: 'white', fontSize: 23, fontWeight: '900' },
  featureType: { color: '#c4f3d5', fontSize: 14, fontWeight: '700' },
  miniMuted: { color: '#8ea0b0', fontSize: 11, lineHeight: 16 },
  playButton: { backgroundColor: GREEN, borderRadius: 50, paddingVertical: 14, alignItems: 'center' },
  playButtonText: { color: '#08231a', fontSize: 16, fontWeight: '900' },
  disabled: { opacity: 0.45 },
  error: { color: '#fecdd3', fontSize: 12 },
  panel: { backgroundColor: '#111b27', borderColor: '#243243', borderWidth: 1,
    borderRadius: 22, padding: 19, gap: 16 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  sectionTitle: { color: '#f8fafc', fontSize: 17, fontWeight: '900' },
  runningBadge: { color: '#86efac', fontSize: 11, fontWeight: '700' },
  modeRow: { flexDirection: 'row', gap: 5, backgroundColor: '#070e17', borderRadius: 12, padding: 4 },
  modeButton: { flex: 1, paddingVertical: 11, paddingHorizontal: 2, borderRadius: 9, alignItems: 'center' },
  modeSelected: { backgroundColor: '#244b3b' },
  modeText: { color: '#92a3b5', fontSize: 12, fontWeight: '700' },
  modeTextSelected: { color: '#86efac' },
  timerBox: { alignItems: 'center', paddingVertical: 20, gap: 5 },
  timerCaption: { color: GREEN, letterSpacing: 3, fontSize: 11, fontWeight: '900' },
  timerValue: { color: '#fff', fontSize: 69, fontWeight: '800', fontVariant: ['tabular-nums'], letterSpacing: -2.5 },
  timerUnder: { color: '#71879a', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  progressTrack: { backgroundColor: '#273648', borderRadius: 8, height: 6, overflow: 'hidden' },
  progressFill: { backgroundColor: GREEN, height: 6, borderRadius: 8 },
  controls: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  mainButton: { flex: 1, backgroundColor: GREEN, alignItems: 'center', borderRadius: 40, paddingVertical: 15 },
  mainButtonText: { color: '#08231a', fontSize: 15, fontWeight: '900' },
  resetButton: { backgroundColor: '#263344', width: 49, height: 49,
    alignItems: 'center', justifyContent: 'center', borderRadius: 50 },
  resetText: { color: '#e2e8f0', fontSize: 29 },
  sessionFooter: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 9 },
  dots: { flexDirection: 'row', gap: 5 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#3d4a56' },
  dotCompleted: { backgroundColor: GREEN },
  fieldLabel: { color: '#c3d0db', fontSize: 13, fontWeight: '700' },
  volumeRow: { flexDirection: 'row', gap: 5 },
  volumeButton: { flex: 1, alignItems: 'center', borderWidth: 1, borderColor: '#324153',
    paddingVertical: 11, borderRadius: 11 },
  volumeSelected: { borderColor: GREEN, backgroundColor: '#1a4232' },
  volumeText: { color: '#94a3b8', fontSize: 11, fontWeight: '700' },
  volumeTextSelected: { color: '#b8f7ce' },
  soundToggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderColor: '#263648', paddingTop: 15 },
  toggleValue: { color: GREEN, fontWeight: '900', fontSize: 13 },
  settingsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#1b2938', padding: 13, borderRadius: 12 },
  settingsText: { color: '#e4edf5', fontSize: 13, fontWeight: '700' },
  settingsArrow: { color: GREEN, fontSize: 21 },
  intervalPanel: { gap: 12 },
  durationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  durationLabel: { color: '#d3e0ea', fontSize: 12, flex: 1 },
  durationControls: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  miniButton: { backgroundColor: '#263849', width: 30, height: 30,
    alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  miniButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  durationValue: { color: '#fff', fontSize: 12, fontWeight: '700', minWidth: 42, textAlign: 'center' },
  library: { gap: 15, paddingTop: 5 },
  libraryTitle: { color: palette.text, fontWeight: '900', fontSize: 23 },
  categories: { gap: 8, paddingVertical: 3 },
  categoryButton: { borderRadius: 25, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: '#334155' },
  categorySelected: { backgroundColor: '#244c38', borderColor: '#4ade80' },
  categoryText: { color: '#94a3b8', fontWeight: '700', fontSize: 12 },
  categoryTextSelected: { color: '#bbf7d0' },
  soundList: { gap: 10 },
  soundRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 11,
    borderRadius: 16, backgroundColor: '#121f2e', borderWidth: 1, borderColor: '#223448' },
  soundSelected: { borderColor: '#4ade8080', backgroundColor: '#193226' },
  pressed: { opacity: 0.75 },
  soundDetail: { flex: 1, gap: 3, minWidth: 0 },
  soundTitle: { color: '#f8fafc', fontSize: 15, fontWeight: '800' },
  soundKind: { color: '#86efac', fontSize: 11, fontWeight: '700' },
  soundDescription: { color: '#94a3b8', fontSize: 11, lineHeight: 16 },
  playSymbol: { color: '#bac7d3', fontSize: 19 },
  activeSymbol: { color: '#4ade80' },
  soundIndex: { position: 'absolute', top: 6, right: 8, color: '#64748b', fontSize: 9 },
  footnote: { color: '#64748b', fontSize: 12, lineHeight: 20, paddingBottom: 16 },
});
