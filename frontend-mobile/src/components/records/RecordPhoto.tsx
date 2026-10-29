import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '../ui/ActionButton';
import { StatusMessage } from '../ui/StatusMessage';
import { palette } from '../../constants/palette';
import { photoEvidenceService } from '../../services/photoEvidenceService';
import { tokenStorage } from '../../services/tokenStorage';
import { getApiErrorMessage } from '../../utils/apiError';

export function RecordPhoto({ goalId, recordId, available, onDelete, readOnly = false }: {
  goalId: number;
  recordId: number;
  available: boolean;
  onDelete?: () => void;
  readOnly?: boolean;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    void tokenStorage.getAccessToken().then((value) => {
      if (active) setToken(value);
    });
    return () => { active = false; };
  }, []));

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      await photoEvidenceService.remove(goalId, recordId);
      setConfirm(false);
      onDelete?.();
    } catch (cause) {
      setError(getApiErrorMessage(cause, 'Could not delete photo.'));
    } finally {
      setBusy(false);
    }
  }

  if (!available) return null;
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Saved photo evidence</Text>
      {token ? <Image source={{ uri: photoEvidenceService.url(goalId, recordId), headers: { Authorization: `Bearer ${token}` } }}
        style={styles.image} resizeMode="contain" onError={() => setError('Photo preview failed. Refresh the screen and try again.')} />
        : <Text style={styles.muted}>Loading photo…</Text>}
      {!readOnly ? (
        <ActionButton title={confirm ? 'Cancel photo deletion' : 'Delete photo'} secondary disabled={busy}
          onPress={() => setConfirm((old) => !old)} />
      ) : null}
      {confirm && !readOnly ? <ActionButton title="Confirm delete photo" busy={busy} onPress={() => { void remove(); }} /> : null}
      {error ? <StatusMessage error message={error} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  label: { color: palette.text, fontSize: 14, fontWeight: '700' },
  image: { width: '100%', height: 230, backgroundColor: palette.surfaceRaised, borderRadius: 10 },
  muted: { color: palette.muted, fontSize: 13 },
});
