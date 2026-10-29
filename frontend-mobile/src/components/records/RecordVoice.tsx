import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '../ui/ActionButton';
import { StatusMessage } from '../ui/StatusMessage';
import { palette } from '../../constants/palette';
import { voiceEvidenceService } from '../../services/voiceEvidenceService';
import { tokenStorage } from '../../services/tokenStorage';
import { getApiErrorMessage } from '../../utils/apiError';

export function RecordVoice({ goalId, recordId, available, onDelete, readOnly = false }: {
  goalId: number;
  recordId: number;
  available: boolean;
  onDelete?: () => void;
  readOnly?: boolean;
}) {
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
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

  if (!available) return null;
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Saved voice note</Text>
      <ActionButton title={status.playing ? 'Pause voice note' : 'Play voice note'} secondary disabled={!token || busy}
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
});
