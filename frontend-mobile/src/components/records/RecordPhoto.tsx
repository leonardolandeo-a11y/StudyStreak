import { useCallback, useState } from 'react';
import { File } from 'expo-file-system';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '../ui/ActionButton';
import { StatusMessage } from '../ui/StatusMessage';
import { palette } from '../../constants/palette';
import { photoEvidenceService } from '../../services/photoEvidenceService';
import { downloadEvidence } from '../../services/evidenceDownloadService';
import { getApiErrorMessage } from '../../utils/apiError';

// Images behind an authenticated API are downloaded into the app's temporary
// cache before rendering. This avoids native Image network/header differences.
export function RecordPhoto({ goalId, recordId, available, onDelete, readOnly = false }: {
  goalId: number;
  recordId: number;
  available: boolean;
  onDelete?: () => void;
  readOnly?: boolean;
}) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useFocusEffect(useCallback(() => {
    if (!available) return;
    let active = true;
    let localFile: File | null = null;

    function dispose(file: File | null) {
      if (!file) return;
      try { if (file.exists) file.delete(); } catch { /* Cache cleanup is best-effort. */ }
    }

    async function loadPhoto() {
      setPhotoUri(null);
      setError(null);
      setLoading(true);
      try {
        localFile = await downloadEvidence(photoEvidenceService.url(goalId, recordId), 'jpg', reloadKey);
        if (active) setPhotoUri(localFile.uri);
      } catch (cause) {
        if (active) {
          const detail = cause instanceof Error ? cause.message : '';
          const message = /\b401\b/.test(detail)
            ? 'Your photo session expired. Sign in again and retry.'
            : /\b403\b/.test(detail)
              ? 'You do not have permission to view this photo.'
              : /\b404\b/.test(detail)
                ? 'The photo could not be found on the server.'
                : getApiErrorMessage(cause, 'Unable to download the saved photo. Try again.');
          setError(message);
        }
        dispose(localFile);
      } finally {
        if (active) setLoading(false);
        else dispose(localFile);
      }
    }

    void loadPhoto();
    return () => {
      active = false;
      dispose(localFile);
    };
  }, [available, goalId, recordId, reloadKey]));

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
      {loading ? <ActivityIndicator size="small" color={palette.primary} /> : null}
      {photoUri ? (
        <Image
          key={photoUri}
          source={{ uri: photoUri }}
          style={styles.image}
          resizeMode="contain"
          onError={(event) => {
            console.warn('Saved photo decoding failed:', event.nativeEvent.error);
            setError('The downloaded photo could not be displayed. Try again.');
          }}
        />
      ) : null}
      {error ? (
        <>
          <StatusMessage error message={error} />
          <ActionButton title="Retry photo preview" secondary disabled={busy || loading}
            onPress={() => setReloadKey((value) => value + 1)} />
        </>
      ) : null}
      {!readOnly ? (
        <ActionButton title={confirm ? 'Cancel photo deletion' : 'Delete photo'} secondary disabled={busy}
          onPress={() => setConfirm((old) => !old)} />
      ) : null}
      {confirm && !readOnly ? (
        <ActionButton title="Confirm delete photo" busy={busy} onPress={() => { void remove(); }} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  label: { color: palette.text, fontSize: 14, fontWeight: '700' },
  image: { width: '100%', height: 230, backgroundColor: palette.surfaceRaised, borderRadius: 10 },
});
