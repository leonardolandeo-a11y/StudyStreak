import { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ActivityIndicator, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { ActionButton } from '../../components/ui/ActionButton';
import { StatusMessage } from '../../components/ui/StatusMessage';
import { palette } from '../../constants/palette';
import { photoEvidenceService } from '../../services/photoEvidenceService';
import { getApiErrorMessage } from '../../utils/apiError';
import { File } from 'expo-file-system';


function deleteTemporaryPhoto(uri: string | null) {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch { /* Temporary cache cleanup is best-effort. */ }
}

export default function StudyCamera() {
  const { goalId: goalParam, recordId: recordParam } = useLocalSearchParams<{ goalId: string; recordId: string }>();
  const goalId = Number(goalParam);
  const recordId = Number(recordParam);
  const valid = Number.isSafeInteger(goalId) && goalId > 0 && Number.isSafeInteger(recordId) && recordId > 0;
  const camera = useRef<CameraView>(null);
  const capturedPhoto = useRef<string | null>(null);
  const active = useRef(true);
  const [permission, requestPermission] = useCameraPermissions();
  const [ready, setReady] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      deleteTemporaryPhoto(capturedPhoto.current);
      capturedPhoto.current = null;
    };
  }, []);

  function discardPhoto() {
    deleteTemporaryPhoto(capturedPhoto.current);
    capturedPhoto.current = null;
    setPhotoUri(null);
    setReady(false);
  }


  async function capture() {
    if (!camera.current || !ready || busy) return;

    setBusy(true);
    setError(null);

    try {
      const photo = await camera.current.takePictureAsync({
        quality: 0.4,
        skipProcessing: false,
      });
      if (!photo?.uri) {
        setError('The camera did not return an image.');
        return;
      }
      const file = new File(photo.uri);
      if (!file.exists || file.size <= 0) {
        setError('The photo file is unavailable. Please try again.');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        deleteTemporaryPhoto(photo.uri);
        setError('The photo exceeds 2 MB. Please retake it.');
        return;
      }
      if (!active.current) {
        deleteTemporaryPhoto(photo.uri);
        return;
      }
      deleteTemporaryPhoto(capturedPhoto.current);
      capturedPhoto.current = photo.uri;
      setPhotoUri(photo.uri);
    } catch {
      setError('The photo could not be taken. Try again.');
    } finally {
      setBusy(false);
    }
  }


  async function upload() {
    if (!photoUri || !valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      await photoEvidenceService.upload(goalId, recordId, photoUri);
      deleteTemporaryPhoto(capturedPhoto.current);
      capturedPhoto.current = null;
      router.back();
    } catch (cause) {
      setError(getApiErrorMessage(cause, 'Could not save the photo. Check your connection and try again.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => router.back()}>
        <Text style={styles.link}>‹ Back to goal</Text>
      </Pressable>
      <Text style={styles.title}>Photo evidence</Text>
      <Text style={styles.muted}>Take a photo of your notes or completed exercises for this daily record.</Text>
      {!valid ? <StatusMessage error message="Invalid daily record." /> : null}
      {valid && !permission ? <ActivityIndicator color={palette.primary} /> : null}
      {valid && permission && !permission.granted ? (
        <View style={styles.card}>
          <Text style={styles.muted}>Camera access is needed to take a photo. You can still add text evidence without it.</Text>
          {permission.canAskAgain ? (
            <ActionButton title="Allow camera access" onPress={() => { void requestPermission(); }} />
          ) : (
            <ActionButton title="Open device settings" onPress={() => { void Linking.openSettings(); }} />
          )}
        </View>
      ) : null}
      {valid && permission?.granted && !photoUri ? (
        <View style={styles.card}>
          <CameraView ref={camera} facing="back" mode="picture" style={styles.camera}
            onCameraReady={() => setReady(true)} onMountError={() => setError('The camera could not start on this device.')} />
          <ActionButton title="Take photo" busy={busy} disabled={!ready} onPress={() => { void capture(); }} />
        </View>
      ) : null}
      {valid && photoUri ? (
        <View style={styles.card}>
          <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="contain" />
          <ActionButton title="Save photo to daily record" busy={busy} onPress={() => { void upload(); }} />
          <ActionButton title="Retake photo" secondary disabled={busy} onPress={discardPhoto} />
        </View>
      ) : null}
      {error ? <StatusMessage error message={error} /> : null}
      <Text style={styles.muted}>JPEG photos up to 2 MB are supported. Photos are visible only to you and accepted tracking partners.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: palette.text, fontSize: 26, fontWeight: '800' },
  muted: { color: palette.muted, fontSize: 14, lineHeight: 21 },
  link: { color: palette.primary, fontWeight: '700', fontSize: 15 },
  card: { backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1, borderRadius: 16, padding: 12, gap: 14 },
  camera: { width: '100%', height: 380, borderRadius: 12, overflow: 'hidden' },
  preview: { width: '100%', height: 380, backgroundColor: palette.surfaceRaised },
});
