import { useCallback, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '../../components/ui/ActionButton';
import { Screen } from '../../components/ui/Screen';
import { StatusMessage } from '../../components/ui/StatusMessage';
import { palette } from '../../constants/palette';
import { voiceEvidenceService } from '../../services/voiceEvidenceService';
import { getApiErrorMessage } from '../../utils/apiError';
import { File } from 'expo-file-system';


export default function StudyVoice() {
  const { goalId: goalParam, recordId: recordParam } = useLocalSearchParams<{ goalId: string; recordId: string }>();
  const goalId = Number(goalParam);
  const recordId = Number(recordParam);
  const valid = Number.isSafeInteger(goalId) && goalId > 0 && Number.isSafeInteger(recordId) && recordId > 0;
  const [uri, setUri] = useState<string | null>(null);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY, (status) => {
        if (status.isFinished) {
          if (status.url) {
            setUri(status.url);
          }
          void setAudioModeAsync({allowsRecording: false,}).catch((cause: unknown) => {
            console.warn('Could not reset the audio mode:', cause);
          });
        }
      }
  );

  const state = useAudioRecorderState(recorder);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);


  useFocusEffect(
      useCallback(() => {
        return () => {
          void (async () => {
            try {
              if (recorder.isRecording) {
                await recorder.stop();
              }
            } finally {
              await setAudioModeAsync({allowsRecording: false,});
            }
          })().catch((cause: unknown) => {
            console.warn('Could not close the recording session:', cause);
          });
        };
      }, [recorder])
  );

  async function start() {
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setPermissionDenied(true);
        return;
      }
      setPermissionDenied(false);
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      setUri(null);
      await recorder.prepareToRecordAsync();
      recorder.record({ forDuration: 90 });
    } catch {
      setError('The microphone could not start. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function stop() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await recorder.stop();
      if (!recorder.uri) throw new Error('No audio file returned');
      setUri(recorder.uri);
      await setAudioModeAsync({ allowsRecording: false });
    } catch {
      setError('The recording could not be completed.');
    } finally {
      setBusy(false);
    }
  }


  async function upload() {
    if (!uri || !valid || busy) return;

    setBusy(true);
    setError(null);

    try {
      const file = new File(uri);

      if (!file.exists || file.size <= 0) {
        setError('The recording file is unavailable. Please record again.');
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        setError('The recording exceeds 2 MB. Please record a shorter note.');
        return;
      }

      await voiceEvidenceService.upload(goalId, recordId, uri);
      router.back();
    } catch (cause) {
      setError(
          getApiErrorMessage(
              cause,
              'Could not save the voice note. Try again.'
          )
      );
    } finally {
      setBusy(false);
    }
  }


  return (
    <Screen>
      <Pressable accessibilityRole="button" onPress={() => router.back()}>
        <Text style={styles.link}>‹ Back to goal</Text>
      </Pressable>
      <Text style={styles.title}>Study voice note</Text>
      <Text style={styles.muted}>Record a short explanation of what you studied for this daily record.</Text>
      {!valid ? <StatusMessage error message="Invalid daily record." /> : null}
      {valid ? (
        <View style={styles.card}>
          {state.isRecording ? (
            <>
              <Text style={styles.time}>Recording · {Math.round(state.durationMillis / 1000)} s</Text>
              <ActionButton title="Finish recording" busy={busy} onPress={() => { void stop(); }} />
            </>
          ) : uri ? (
            <>
              <Text style={styles.muted}>Recording ready. Saving will attach it to your daily record.</Text>
              <ActionButton title="Save voice note" busy={busy} onPress={() => { void upload(); }} />
              <ActionButton title="Discard and record again" secondary disabled={busy} onPress={() => { void start(); }} />
            </>
          ) : (
            <ActionButton title="Start voice recording" busy={busy} onPress={() => { void start(); }} />
          )}
          {permissionDenied ? (
            <>
              <Text style={styles.muted}>Microphone access is disabled. Text notes are still available.</Text>
              <ActionButton title="Open device settings" secondary onPress={() => { void Linking.openSettings(); }} />
            </>
          ) : null}
        </View>
      ) : null}
      {error ? <StatusMessage error message={error} /> : null}
      <Text style={styles.muted}>M4A recordings of up to 90 seconds and 2 MB are supported. Only you and accepted tracking partners can listen to them.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  link: { color: palette.primary, fontWeight: '700', fontSize: 15 },
  title: { color: palette.text, fontSize: 27, fontWeight: '800' },
  muted: { color: palette.muted, fontSize: 14, lineHeight: 21 },
  time: { color: palette.primary, fontSize: 18, fontWeight: '700' },
  card: { backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1, borderRadius: 16, padding: 16, gap: 14 },
});
