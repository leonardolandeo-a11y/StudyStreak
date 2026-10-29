import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '../ui/ActionButton';
import { StatusMessage } from '../ui/StatusMessage';
import { palette } from '../../constants/palette';
import { voiceEvidenceService } from '../../services/voiceEvidenceService';
import { tokenStorage } from '../../services/tokenStorage';
import { getApiErrorMessage } from '../../utils/apiError';

function clock(seconds: number): string {
  const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

export function RecordVoice({ goalId, recordId, available, onDelete, readOnly = false }: {
  goalId: number;
  recordId: number;
  available: boolean;
  onDelete?: () => void;
  readOnly?: boolean;
}) {
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const [pulse] = useState(() => new Animated.Value(1));
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    let active = true;
    void tokenStorage.getAccessToken().then((value) => {
      if (active) setToken(value);
    }).catch(() => { if (active) setError('Unable to access your session.'); });
    return () => { active = false; player.pause(); };
  }, [player]));

  useEffect(() => {
    if (!available || !token) {
      player.replace(null);
      return;
    }
    player.replace({
      uri: voiceEvidenceService.url(goalId, recordId),
      headers: { Authorization: `Bearer ${token}` },
    });
  }, [available, goalId, recordId, token, player]);

  useEffect(() => {
    if (!status.playing) {
      pulse.setValue(1);
      return;
    }
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 0.25, duration: 600, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]));
    animation.start();
    return () => { animation.stop(); pulse.setValue(1); };
  }, [status.playing, pulse]);

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      player.pause();
      await voiceEvidenceService.remove(goalId, recordId);
      setConfirm(false);
      onDelete?.();
    } catch (cause) {
      setError(getApiErrorMessage(cause, 'Unable to remove the voice note.'));
    } finally {
      setBusy(false);
    }
  }

  const elapsed = Math.max(0, status.currentTime || 0);
  const duration = Math.max(0, status.duration || 0);
  const percent = duration > 0 ? Math.min(100, Math.round((elapsed / duration) * 100)) : 0;
  const stateLabel = status.playing ? 'Playing' : status.isBuffering ? 'Buffering' :
    status.didJustFinish ? 'Finished' : elapsed > 0 && duration > 0 && elapsed < duration ? 'Paused' : 'Ready to play';

  if (!available) return null;
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Saved voice note</Text>
      <View style={styles.playback} accessibilityLabel={`Voice note ${stateLabel.toLowerCase()}`}>
        <View style={styles.statusRow}>
          <Animated.View style={[styles.indicator, status.playing ? styles.indicatorPlaying : styles.indicatorIdle,
            { opacity: status.playing ? pulse : 1 }]} />
          <Text style={[styles.stateText, status.playing && styles.statePlaying]}>{stateLabel}</Text>
          <Text style={styles.timer}>{clock(elapsed)} / {clock(duration)}</Text>
        </View>
        <View style={styles.track} accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: percent }}>
          <View style={[styles.progress, { width: `${percent}%` as `${number}%` }]} />
        </View>
      </View>
      <ActionButton title={status.playing ? 'Pause voice note' : '▶ Play voice note'} secondary disabled={!token || busy}
        onPress={() => { if (status.playing) player.pause(); else player.play(); }} />
      {status.error ? <StatusMessage error message="Voice note could not be played. Try refreshing." /> : null}
      {!readOnly ? (
        <ActionButton title={confirm ? 'Cancel deletion' : 'Delete voice note'} secondary disabled={busy}
          onPress={() => setConfirm((old) => !old)} />
      ) : null}
      {confirm && !readOnly ? <ActionButton title="Confirm delete voice note" busy={busy} onPress={() => { void remove(); }} /> : null}
      {error ? <StatusMessage error message={error} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  label: { color: palette.text, fontWeight: '700', fontSize: 14 },
  playback: { backgroundColor: palette.surfaceRaised, borderRadius: 12, padding: 13, gap: 10 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  indicator: { width: 10, height: 10, borderRadius: 5 },
  indicatorPlaying: { backgroundColor: '#fb4b5e' },
  indicatorIdle: { backgroundColor: palette.muted },
  stateText: { color: palette.text, fontSize: 13, fontWeight: '700', flex: 1 },
  statePlaying: { color: '#fda4af' },
  timer: { color: palette.muted, fontSize: 12, fontVariant: ['tabular-nums'] },
  track: { height: 5, backgroundColor: palette.border, borderRadius: 4, overflow: 'hidden' },
  progress: { height: '100%', backgroundColor: palette.primary, borderRadius: 4 },
});
