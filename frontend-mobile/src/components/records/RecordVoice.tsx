import { useCallback, useEffect, useState } from 'react';
import { File, FileMode } from 'expo-file-system';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
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
  if (/Invalid M4A/.test(detail)) return 'The downloaded voice note is not a valid M4A file. Please record it again.';
  return getApiErrorMessage(cause, 'Unable to download the voice note. Check your connection and retry.');
}

function verifyM4a(file: File) {
  if (!file.exists || file.size < 12 || file.size > 2 * 1024 * 1024) {
    throw new Error('Invalid M4A voice note: unexpected file size.');
  }

  // The backend accepts ISO BMFF (ftyp) M4A files. Detect a damaged or
  // incorrectly decoded binary response before handing it to the native player.
  const handle = file.open(FileMode.ReadOnly);
  try {
    const header = handle.readBytesSync(12);
    if (header.length < 12 || header[4] !== 102 || header[5] !== 116 ||
        header[6] !== 121 || header[7] !== 112) {
      throw new Error('Invalid M4A voice note: missing ftyp header.');
    }
  } finally {
    handle.close();
  }
}

function VoicePlayback({ uri, busy, onRetry }: {
  uri: string;
  busy: boolean;
  onRetry: () => void;
}) {
  // Create the native player *after* the authenticated M4A has been saved.
  // This avoids repeatedly replacing the empty source while the file loads.
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  const [pulse] = useState(() => new Animated.Value(1));
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const [playError, setPlayError] = useState<string | null>(null);

  useEffect(() => {
    if (status.isLoaded || status.error) return;
    const timer = setTimeout(() => setLoadTimedOut(true), 15000);
    return () => clearTimeout(timer);
  }, [status.isLoaded, status.error]);

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

  const elapsed = Math.max(0, status.currentTime || 0);
  const duration = Math.max(0, status.duration || 0);
  const percent = duration > 0 ? Math.min(100, Math.round((elapsed / duration) * 100)) : 0;
  const nativeError = status.error ? 'The audio player could not decode this file.' : null;
  const timeoutError = loadTimedOut && !status.isLoaded ?
    'Audio did not finish loading on this device. Retry the voice note.' : null;
  const playbackError = nativeError || timeoutError || playError;
  const stateLabel = playbackError ? 'Playback failed' : !status.isLoaded ?
    status.isBuffering ? 'Buffering audio' : 'Loading audio' :
      status.playing ? 'Playing' : status.didJustFinish ? 'Finished' :
        elapsed > 0 && duration > 0 && elapsed < duration ? 'Paused' : 'Ready to play';
  const canPlay = status.isLoaded && !playbackError && !busy;

  function togglePlayback() {
    if (status.playing) {
      player.pause();
    } else if (canPlay) {
      setPlayError(null);
      if (status.didJustFinish || (duration > 0 && elapsed >= duration)) {
        void player.seekTo(0).then(() => player.play()).catch(() => {
          setPlayError('The voice note could not restart. Please retry.');
        });
      } else {
        try {
          player.play();
        } catch {
          setPlayError('The voice note could not start. Please retry.');
        }
      }
    }
  }

  return (
    <>
      <View style={styles.playback} accessibilityLabel={`Voice note ${stateLabel.toLowerCase()}`}>
        <View style={styles.statusRow}>
          <Animated.View style={[styles.indicator,
            status.playing ? styles.indicatorPlaying : styles.indicatorIdle,
            { opacity: status.playing ? pulse : 1 }]} />
          <Text style={[styles.stateText, status.playing && styles.statePlaying]}>{stateLabel}</Text>
          <Text style={styles.timer}>{clock(elapsed)} / {clock(duration)}</Text>
        </View>
        <View style={styles.track} accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: percent }}>
          <View style={[styles.progress, { width: `${percent}%` as `${number}%` }]} />
        </View>
      </View>
      <ActionButton title={status.playing ? 'Pause voice note' : '▶ Play voice note'} secondary
        disabled={!canPlay && !status.playing} onPress={togglePlayback} />
      {playbackError ? <StatusMessage error message={playbackError} /> : null}
      {playbackError ? (
        <ActionButton title="Retry voice playback" secondary disabled={busy} onPress={onRetry} />
      ) : null}
    </>
  );
}

export function RecordVoice({ goalId, recordId, available, onDelete, readOnly = false }: {
  goalId: number;
  recordId: number;
  available: boolean;
  onDelete?: () => void;
  readOnly?: boolean;
}) {
  const [uri, setUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    if (!available) return;
    let active = true;
    let localFile: File | null = null;

    function cleanUp(file: File | null) {
      if (!file) return;
      try { if (file.exists) file.delete(); } catch { /* Best-effort cache cleanup. */ }
    }

    async function loadVoiceNote() {
      setUri(null);
      setError(null);
      setLoading(true);
      try {
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
        const downloaded = await downloadEvidence(voiceEvidenceService.url(goalId, recordId), 'm4a', retryKey);
        localFile = downloaded;
        verifyM4a(downloaded);
        if (active) {
          setUri(downloaded.uri);
        } else {
          cleanUp(downloaded);
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
      setUri(null);
      cleanUp(localFile);
    };
  }, [available, goalId, recordId, retryKey]));

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      setUri(null);
      await voiceEvidenceService.remove(goalId, recordId);
      setConfirm(false);
      onDelete?.();
    } catch (cause) {
      setError(getApiErrorMessage(cause, 'Unable to remove the voice note.'));
      setRetryKey((value) => value + 1);
    } finally {
      setBusy(false);
    }
  }

  if (!available) return null;
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Saved voice note</Text>
      {loading ? (
        <>
          <ActivityIndicator size="small" color={palette.primary} />
          <Text style={styles.stateText}>Downloading voice note...</Text>
        </>
      ) : null}
      {uri && !loading ? (
        <VoicePlayback key={uri} uri={uri} busy={busy} onRetry={() => setRetryKey((value) => value + 1)} />
      ) : null}
      {error ? <StatusMessage error message={error} /> : null}
      {error ? <ActionButton title="Retry voice playback" secondary disabled={busy || loading}
        onPress={() => setRetryKey((value) => value + 1)} /> : null}
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
