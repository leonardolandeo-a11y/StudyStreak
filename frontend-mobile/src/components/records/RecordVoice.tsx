import { useCallback, useEffect, useState } from 'react';
import { File } from 'expo-file-system';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, Animated, StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '../ui/ActionButton';
import { StatusMessage } from '../ui/StatusMessage';
import { palette } from '../../constants/palette';
import { voiceEvidenceService } from '../../services/voiceEvidenceService';
import { downloadEvidence } from '../../services/evidenceDownloadService';
import { getApiErrorMessage } from '../../utils/apiError';

function clock(seconds: number): string {
  const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

function downloadMessage(cause: unknown): string {
  const detail = cause instanceof Error ? cause.message : '';
  if (/\b401\b/.test(detail)) return 'Your session expired. Sign in again to listen to this note.';
  if (/\b403\b/.test(detail)) return 'You do not have permission to listen to this note.';
  if (/\b404\b/.test(detail)) return 'The voice note could not be found on the server.';
  return getApiErrorMessage(cause, 'Unable to download the voice note. Check your connection and retry.');
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
  const [loading, setLoading] = useState(false);
  const [sourceReady, setSourceReady] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Native players may fail to stream authenticated URLs. Download to the
  // app's private temporary cache, then play the local M4A without HTTP headers.
  useFocusEffect(useCallback(() => {
    if (!available) return;
    let active = true;
    let localFile: File | null = null;

    function cleanUp(file: File | null) {
      if (!file) return;
      try { if (file.exists) file.delete(); } catch { /* Best-effort cache cleanup. */ }
    }

    async function loadVoiceNote() {
      setError(null);
      setSourceReady(false);
      setLoading(true);
      player.pause();
      player.replace(null);

      try {
        localFile = await downloadEvidence(voiceEvidenceService.url(goalId, recordId), 'm4a', retryKey);
        if (active) {
          player.replace(localFile.uri);
          setSourceReady(true);
        } else {
          cleanUp(localFile);
        }
      } catch (cause) {
        if (active) setError(downloadMessage(cause));
        cleanUp(localFile);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadVoiceNote();
    return () => {
      active = false;
      player.pause();
      player.replace(null);
      cleanUp(localFile);
    };
  }, [available, goalId, recordId, retryKey, player]));

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
  const playbackError = status.error ? 'The audio file could not be decoded or played on this device.' : null;
  const stateLabel = loading ? 'Downloading voice note' : error ? 'Download failed' :
    playbackError ? 'Playback failed' : !sourceReady || !status.isLoaded ? 'Loading audio' :
      status.playing ? 'Playing' : status.isBuffering ? 'Buffering' :
        status.didJustFinish ? 'Finished' : elapsed > 0 && duration > 0 && elapsed < duration ? 'Paused' : 'Ready to play';
  const canPlay = sourceReady && status.isLoaded && !loading && !error && !playbackError && !busy;

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
      {loading ? <ActivityIndicator size="small" color={palette.primary} /> : null}
      <ActionButton title={status.playing ? 'Pause voice note' : '▶ Play voice note'} secondary
        disabled={!canPlay && !status.playing}
        onPress={() => { if (status.playing) player.pause(); else if (canPlay) player.play(); }} />
      {error ? <StatusMessage error message={error} /> : null}
      {playbackError ? <StatusMessage error message={playbackError} /> : null}
      {(error || playbackError) ? (
        <ActionButton title="Retry voice playback" secondary disabled={busy || loading}
          onPress={() => setRetryKey((value) => value + 1)} />
      ) : null}
      {!readOnly ? (
        <ActionButton title={confirm ? 'Cancel deletion' : 'Delete voice note'} secondary disabled={busy}
          onPress={() => setConfirm((old) => !old)} />
      ) : null}
      {confirm && !readOnly ? <ActionButton title="Confirm delete voice note" busy={busy} onPress={() => { void remove(); }} /> : null}
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
