import { useLocalMusic } from '../../../hooks/useLocalMusic';
import { LocalMusicLibrary } from '../../../components/focus/LocalMusicLibrary';
import { workspacePalette } from '../../../components/academic/workspacePalette';
import { getApiErrorMessage } from "../../../utils/apiError";
import { studyTracking, recoverTrackedTimer, mergePending, readPending, savePending, removePending } from "../../../services/studyTracking";
import { useCallback, useEffect, useRef, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import {
  AppState, ScrollView, Text, View,
} from 'react-native';
import { Screen } from '../../../components/ui/Screen';
import { useAuth } from '../../../hooks/useAuth';
import { useAppearance } from '../../../hooks/useAppearance';
import { AcademicPanel as Card, AcademicHeading } from '../../../components/academic/Academic';
import { ActionButton } from '../../../components/ui/ActionButton';
import { StatusMessage } from '../../../components/ui/StatusMessage';
import { NavigationPressable } from '../../../components/navigation/NavigationPressable';
import { FocusTimerPanel } from '../../../components/focus/FocusTimerPanel';
import { FocusArtwork } from '../../../components/focus/FocusArtwork';
import { FocusSoundCarousel } from '../../../components/focus/FocusSoundCarousel';
import { FocusSettingsDialog } from '../../../components/focus/FocusSettingsDialog';
import { MobileFocusAudio } from '../../../features/focus/mobileFocusAudio';
import {
  advancePomodoro, discardPendingFocusSession, durationMs, formatPomodoroTime, newPomodoro,
  pausePomodoro, remainingPomodoroMs, resetPomodoro, restorePomodoro,
  selectPomodoroMode, startPomodoro, updatePomodoroPreferences,
} from '../../../features/focus/pomodoroState';
import type {
  CompletedFocusSession, PomodoroPreferences, PomodoroState, Soundscape,
} from '../../../features/focus/pomodoroState';
import { soundscapeById } from '../../../features/focus/soundscapes';
import type { Goal } from '../../../types/goal';
import {
  listActiveFocusGoals, recordMobileFocusCompletion,
} from '../../../features/focus/focusGoalService';
import { createFocusSessionId } from '../../../features/focus/focusSessionId';

export default function FocusStudioMobile() {
  const { goalId: goalParam } = useLocalSearchParams<{ goalId?: string }>();
  const requestedGoalId = goalParam ? Number(goalParam) : null;
  const validRequestedGoal = requestedGoalId !== null &&
    Number.isSafeInteger(requestedGoalId) && requestedGoalId > 0;
  const { currentUser } = useAuth();
  const { theme: globalTheme } = useAppearance();
  const theme = { ...globalTheme, colors: workspacePalette(globalTheme) };
  const [timerBusy, setTimerBusy] = useState(false);
  const timerAction = useRef(false);
  const userId = currentUser?.id;
  const key = userId ? `focus_studio_v1_${userId}` : '';
  const selectionKey = userId ? `focus_studio_goal_v1_${userId}` : '';
  const [timer, setTimer] = useState<PomodoroState>(() => newPomodoro());
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [playing, setPlaying] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [goalsError, setGoalsError] = useState<string | null>(null);
  const [goalsRevision, setGoalsRevision] = useState(0);
  const [goalPickerOpen, setGoalPickerOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [selectedGoalLoadedFor, setSelectedGoalLoadedFor] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [syncRevision, setSyncRevision] = useState(0);
  const saving = useRef<Promise<void>>(Promise.resolve());
  const inFlight = useRef(new Set<string>());
  const failed = useRef(new Set<string>());
  const audio = useRef<MobileFocusAudio | null>(null);
  const playbackRequest = useRef(0);
  const focused = useRef(false);
  const notifiedAt = useRef<number | null>(null);

  const music = useLocalMusic(stopAudio, timer.preferences.volume);
  const importedTrack = music.tracks.find(track => track.id === music.activeId);

  const selectionReady = selectedGoalLoadedFor === selectionKey && Boolean(selectionKey);

  function getAudio(): MobileFocusAudio {
    if (!audio.current) audio.current = new MobileFocusAudio();
    return audio.current;
  }

      const previousTracked = useRef<string | null>(null);
      useEffect(() => {
        const retry = setInterval(() => {
            failed.current.clear();
            if (AppState.currentState === "active") setSyncRevision(value => value + 1);
            setTimer(previous => previous.pendingFocusSessions.length ? { ...previous, pendingFocusSessions: [...previous.pendingFocusSessions] } : previous);
        }, 30000);
        return () => clearInterval(retry);
    }, []);
  useEffect(() => {
        const before = previousTracked.current;
        previousTracked.current = timer.activeFocusSession?.sessionId ?? null;
        if (before && before !== previousTracked.current && !timer.pendingFocusSessions.some(item => item.sessionId === before))
            void studyTracking.pulse(before, 'CANCEL').catch(() => setSaveError('Cancellation is pending. Reconnect before starting another recording.'));
    }, [timer.activeFocusSession, timer.pendingFocusSessions]);
  useEffect(() => {
        if (userId == null || !ready) return;
        let active = true;
        let recovering = false;
        const recover = async () => {
            if (recovering) return;
            recovering = true;
            try {
                const pending = await readPending(userId);
                const response = await studyTracking.recover();
                if (!active) return;
                failed.current.clear();
                if (response.session) setSelectedGoalId(response.session.goal_id);
                setTimer(previous => recoverTrackedTimer({ ...previous, pendingFocusSessions:
                    mergePending(previous.pendingFocusSessions, pending) }, response.session, response.serverNow));
                setSyncRevision(value => value + 1);
            } catch { if (active) setSaveError('Recording recovery unavailable. Pending sessions remain on this device.'); } finally { recovering = false; }
        };
        void recover();
        const recoveryInterval = setInterval(() => { if (AppState.currentState === "active") void recover(); }, 30000);
        const subscription = AppState.addEventListener('change', state => { if (state === 'active') void recover(); });
        return () => { active = false; clearInterval(recoveryInterval); subscription.remove(); };
    }, [userId, ready]);

    useEffect(() => {
        const session = timer.activeFocusSession;
        if (!session || timer.endsAt === null) return;
        let sending = false;
        const pulse = async () => {
            if (sending || AppState.currentState !== 'active') return;
            sending = true;
            try { await studyTracking.pulse(session.sessionId, 'PULSE'); }
            catch { setSaveError('Recording connection interrupted. Unobserved time will not be credited.'); }
            finally { sending = false; }
        };
        void pulse();
        const interval = setInterval(() => { void pulse(); }, 12000);
        return () => clearInterval(interval);
    }, [timer.activeFocusSession, timer.endsAt]);

  useEffect(() => {
    let active = true;
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

  // Serialize writes: an older paused snapshot cannot overwrite a newer completion.
  useEffect(() => {
    if (!ready || !key) return;
    const snapshot = JSON.stringify(timer);
    saving.current = saving.current.catch(() => {}).then(() =>
      SecureStore.setItemAsync(key, snapshot));
    void saving.current.catch(() => {});
  }, [key, timer, ready]);

  useEffect(() => {
    if (!selectionKey) return;
    let active = true;
    void SecureStore.getItemAsync(selectionKey).then(saved => {
      if (!active) return;
      const parsed = saved ? Number(saved) : null;
      const stored = parsed !== null && Number.isSafeInteger(parsed) && parsed > 0
        ? parsed : null;
      setSelectedGoalId(validRequestedGoal ? requestedGoalId : stored);
      setSelectedGoalLoadedFor(selectionKey);
    }).catch(() => {
      if (!active) return;
      setSelectedGoalId(validRequestedGoal ? requestedGoalId : null);
      setSelectedGoalLoadedFor(selectionKey);
    });
    return () => { active = false; };
  }, [selectionKey, requestedGoalId, validRequestedGoal]);

  useEffect(() => {
    if (!selectionReady) return;
    const promise = selectedGoalId === null
      ? SecureStore.deleteItemAsync(selectionKey)
      : SecureStore.setItemAsync(selectionKey, String(selectedGoalId));
    void promise.catch(() => {});
  }, [selectionKey, selectionReady, selectedGoalId]);

  useFocusEffect(useCallback(() => {
    // The revision dependency intentionally starts a new request after tapping Retry.
    void goalsRevision;
    const controller = new AbortController();
    void Promise.resolve().then(async () => {
      if (userId == null || controller.signal.aborted) return;
      setGoalsLoading(true);
      setGoalsError(null);
      try {
        const response = await listActiveFocusGoals(userId, controller.signal);
        if (!controller.signal.aborted) setGoals(response);
      } catch {
        if (!controller.signal.aborted) setGoalsError('Could not load Goals. Check your connection.');
      } finally {
        if (!controller.signal.aborted) setGoalsLoading(false);
      }
    });
    return () => controller.abort();
  }, [userId, goalsRevision]));

  useEffect(() => {
    if (!ready || !focused.current || userId == null) return;
    for (const pending of timer.pendingFocusSessions) {
      if (failed.current.has(pending.sessionId) || inFlight.current.has(pending.sessionId)) continue;
      inFlight.current.add(pending.sessionId);
      void savePending(userId, pending).then(() => recordMobileFocusCompletion(pending)).then(() => removePending(userId, pending.sessionId)).then(() => {
        failed.current.delete(pending.sessionId);
        setTimer(previous => discardPendingFocusSession(previous, pending.sessionId));
        setSaveError(null);
        setSyncRevision(previous => previous + 1);
      }).catch(cause => {
        failed.current.add(pending.sessionId);
        setSaveError(getApiErrorMessage(cause, 'Awaiting server confirmation. Pending session retained for retry.'));
      }).finally(() => { inFlight.current.delete(pending.sessionId); });
    }
  }, [timer.pendingFocusSessions, ready, syncRevision, userId]);

  useFocusEffect(useCallback(() => {
    focused.current = true;
    const refresh = () => {
      const current = Date.now();
      setNow(current);
      setTimer(previous => advancePomodoro(previous, current));
    };
    refresh();
    failed.current.clear();
    setSyncRevision(previous => previous + 1);
    const clock = setInterval(refresh, 500);
    const sub = AppState.addEventListener('change', state => {
      if (state !== 'active') stopAudio();
      if (state === 'active') {
        refresh();
        failed.current.clear();
        setSyncRevision(previous => previous + 1);
      }
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
  const activeTrack = soundscapeById(timer.preferences.soundscape);
  const selectedGoal = goals.find(goal => goal.id === selectedGoalId);
  const linkedSession = timer.activeFocusSession;
  const goalLocked = linkedSession !== null;
  const pendingSync = timer.pendingFocusSessions.length;

  function updatePreferences(changes: Partial<PomodoroPreferences>) {
    setTimer(previous => updatePomodoroPreferences(previous, changes));
  }

  async function toggleTimer() {
    if (!ready) return;
    const current = Date.now();
    setNow(current);
    const linked: CompletedFocusSession | null =
      !running && timer.mode === 'focus' && !timer.activeFocusSession && selectedGoal
        ? { sessionId: createFocusSessionId(), goalId: selectedGoal.id,
            durationMinutes: timer.preferences.focusMinutes }
        : null;
        let recovered: Awaited<ReturnType<typeof studyTracking.recover>> | null = null;
        try {
            if (timer.activeFocusSession) await studyTracking.pulse(timer.activeFocusSession.sessionId, running ? 'PAUSE' : 'RESUME');
            else if (linked) await studyTracking.start(linked);
            if (timer.activeFocusSession || linked) recovered = await studyTracking.recover();
        } catch { setSaveError('Could not start or change server recording. Reopen Focus Studio to recover an active session.'); return; }
    setTimer(previous => {
            const next = running ? pausePomodoro(previous, Date.now()) : startPomodoro(previous, Date.now(), linked);
            return recovered ? recoverTrackedTimer(next, recovered.session, recovered.serverNow) : next;
        });
    if (timer.preferences.soundEffects && focused.current) {
      void getAudio().cue(running ? 'pause' : 'start', timer.preferences.volume);
    }
  }

  function chooseGoal(goalId: number | null) {
    if (goalLocked) return;
    setSelectedGoalId(goalId);
    setGoalPickerOpen(false);
  }

  function retrySync() {
    failed.current.clear();
    setSaveError(null);
    setSyncRevision(value => value + 1);
  }

  function stopAudio() {
    playbackRequest.current++;
    audio.current?.stop();
    setPlaying(false);
    setLoadingAudio(false);
  }

  async function chooseSound(sound: Soundscape) {
    if (!ready || !focused.current) return;
    music.deactivate();
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

  async function runTimerAction() {
    if (timerAction.current) return;
    timerAction.current = true; setTimerBusy(true);
    try { await toggleTimer(); }
    finally { timerAction.current = false; setTimerBusy(false); }
  }

  if (!currentUser) return null;
  return <>
    <Screen themed compact backgroundColor={theme.colors.background}>
      <AcademicHeading title="Focus Studio" eyebrow="YOUR FOCUS SPACE" description="One task. Your pace. Your sound." focus />
      <FocusTimerPanel mode={timer.mode} time={formatPomodoroTime(remaining)} progress={progress} running={running}
        paused={!running && (goalLocked || remaining < total)} ready={ready} locked={goalLocked} busy={timerBusy}
        onMode={mode => setTimer(previous => selectPomodoroMode(previous, mode))} onToggle={() => { void runTimerAction(); }}
        onReset={() => setTimer(previous => resetPomodoro(previous))}
        onSettings={() => { if (!loadingAudio && !timerBusy) setSettingsOpen(true); }} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <View style={{ flexGrow: 1, flexBasis: 280 }}>
          <Card style={{ padding: 16, flex: 1, backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: 16, fontWeight: '600' }}>Now Playing</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <FocusArtwork sound={timer.preferences.soundscape} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ color: theme.colors.text, fontWeight: '600', fontSize: 16 }}>{importedTrack?.name ?? activeTrack.title}</Text>
                <Text style={{ color: theme.colors.muted, fontSize: 12 }}>{importedTrack ? music.loading ? 'Preparing audio…' : music.playing ? 'Playing' : 'Paused' : loadingAudio ? 'Preparing audio…' : playing ? 'Playing' : 'Paused'} · {importedTrack ? 'Local music' : activeTrack.kind}</Text>
              </View>
            </View>
            <Text style={{ color: theme.colors.muted, fontSize: 13, lineHeight: 19 }}>{importedTrack ? 'Imported from this device for this session.' : activeTrack.description}</Text>
            <ActionButton title={importedTrack ? music.playing ? 'Pause imported music' : 'Play imported music' : playing ? 'Pause soundscape' : 'Play soundscape'} busy={importedTrack ? music.loading : loadingAudio} disabled={!ready}
              onPress={() => { if (importedTrack) { if (music.playing) music.pause(); else void music.play(importedTrack.id); } else if (playing) stopAudio(); else void chooseSound(timer.preferences.soundscape); }} />
            {audioError ? <StatusMessage error message={audioError} /> : null}
          </Card>
        </View>
        <View style={{ flexGrow: 1, flexBasis: 280 }}>
          <Card style={{ padding: 16, flex: 1, backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
            <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: 16, fontWeight: '600' }}>Study toward a Goal</Text>
            <NavigationPressable accessibilityRole="button" accessibilityLabel="Choose study Goal"
              accessibilityState={{ disabled: goalLocked || goalsLoading || !selectionReady || timerBusy }}
              disabled={goalLocked || goalsLoading || !selectionReady || timerBusy} onPress={() => setGoalPickerOpen(value => !value)}
              style={{ minHeight: 48, justifyContent: 'center', borderRadius: 10, padding: 10, backgroundColor: theme.colors.surfaceRaised }}>
              <Text style={{ color: theme.colors.text, fontSize: 14 }}>{selectedGoal?.topic ?? (linkedSession ? `Linked Goal #${linkedSession.goalId}` : 'Timer only · No Goal selected')}</Text>
            </NavigationPressable>
            {goalPickerOpen && !goalLocked ? <ScrollView nestedScrollEnabled style={{ maxHeight: 220 }}>
              <ActionButton title="No Goal — timer only" secondary onPress={() => chooseGoal(null)} />
              {goals.map(goal => <NavigationPressable key={goal.id} accessibilityRole="button" accessibilityLabel={`Select Goal ${goal.topic}`}
                accessibilityState={{ selected: goal.id === selectedGoalId }} onPress={() => chooseGoal(goal.id)}
                style={{ minHeight: 48, justifyContent: 'center', padding: 10 }}>
                <Text style={{ color: goal.id === selectedGoalId ? theme.colors.primary : theme.colors.text }}>{goal.topic}</Text>
              </NavigationPressable>)}
            </ScrollView> : null}
            {goalsLoading ? <StatusMessage message="Loading active Goals…" /> : null}
            {goalsError ? <><StatusMessage error message={goalsError} /><ActionButton title="Retry Goals" secondary onPress={() => setGoalsRevision(value => value + 1)} /></> : null}
            {!goalsLoading && !goalsError && goals.length === 0 ? <StatusMessage message="No active Goals yet. Create one from Menu." /> : null}
            <Text style={{ color: theme.colors.muted, fontSize: 12, lineHeight: 18 }}>{goalLocked
              ? 'Goal and duration are locked until this session completes or is reset.'
              : 'Choose an active Goal to record observed time. Timer-only sessions do not add Goal time.'}</Text>
            <ActionButton title={selectedGoal ? 'Goal details' : 'My Goals'} secondary onPress={() => selectedGoal
              ? router.push({ pathname: '/(app)/goals/[goalId]', params: { goalId: String(selectedGoal.id) } }) : router.navigate('/goals')} />
          </Card>
        </View>
      </View>
      {pendingSync > 0 ? <StatusMessage message={`${pendingSync} completed sessions pending sync · excluded from confirmed totals`} /> : null}
      {saveError ? <><StatusMessage error message={saveError} /><ActionButton title="Retry sync" secondary onPress={retrySync} /></> : null}
      <LocalMusicLibrary music={music} ready={ready}/>
      <FocusSoundCarousel colors={theme.colors} selected={timer.preferences.soundscape} playing={playing} loading={loadingAudio} ready={ready}
        onChoose={sound => { void chooseSound(sound); }} />
      <Text style={{ color: theme.colors.muted, fontSize: 12 }}>{timer.focusSessions} local focus cycles on this device · not server-verified session totals</Text>
      <NavigationPressable accessibilityRole="button" accessibilityLabel="Open Study Rooms" onPress={() => router.navigate('/study-rooms')}
        style={{ minHeight: 48, justifyContent: 'center' }}><Text style={{ color: theme.colors.primary, fontSize: 14 }}>Study together · Open Study Rooms ›</Text></NavigationPressable>
      <Text style={{ color: theme.colors.muted, fontSize: 12, lineHeight: 18 }}>Sounds are synthesized on your device without streaming. Audio stops when you leave Focus Studio.</Text>
    </Screen>
    {settingsOpen ? <FocusSettingsDialog preferences={timer.preferences} locked={running || goalLocked}
      onClose={() => setSettingsOpen(false)} onSave={draft => {
        updatePreferences({ volume: draft.volume, soundEffects: draft.soundEffects, ...(!running && !goalLocked ? {
          focusMinutes: draft.focusMinutes, shortBreakMinutes: draft.shortBreakMinutes, longBreakMinutes: draft.longBreakMinutes,
        } : {}) });
        audio.current?.volume(draft.volume);
        setSettingsOpen(false);
      }} /> : null}
  </>;
}
