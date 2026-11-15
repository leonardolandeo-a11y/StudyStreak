import { AcademicSprite } from '../../../../../components/academic/AcademicSprite';
import { workspacePalette } from '../../../../../components/academic/workspacePalette';
import { ValidationStepper } from '../../../../../components/validations/ValidationStepper';
import { AcademicHeading, AcademicEmpty } from '../../../../../components/academic/Academic';
import { useCallback, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ValidationPartnerRow } from '../../../../../components/validations/ValidationPartnerRow';
import { DifficultyBadge } from '../../../../../components/goals/GoalDifficulty';
import { NavigationPressable } from '../../../../../components/navigation/NavigationPressable';
import { AppIcon } from '../../../../../components/ui/AppIcon';
import { RefreshButton } from '../../../../../components/ui/RefreshButton';
import { useFocusEffect, useIsFocused } from 'expo-router';
import { useMenuAction } from '../../../../../contexts/MenuActionContext';
import { isAxiosError } from 'axios';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../../../../components/ui/Screen';
import { ActionButton } from '../../../../../components/ui/ActionButton';
import { PageControls } from '../../../../../components/ui/PageControls';
import { StatusMessage } from '../../../../../components/ui/StatusMessage';
import { ValidationEditor } from '../../../../../components/validations/ValidationEditor';
import { RecordPhoto } from '../../../../../components/records/RecordPhoto';
import { RecordVoice } from '../../../../../components/records/RecordVoice';
import { useAppearance } from '../../../../../hooks/useAppearance';
import type { ThemeColors } from '../../../../../features/appearance/theme';
import { CreationModal, useCreationBusy, useCreationComplete } from '../../../../../components/ui/CreationModal';
import { useAuth } from '../../../../../hooks/useAuth';
import { usePagedResource } from '../../../../../hooks/usePagedResource';
import { trackingLinkService } from '../../../../../services/trackingLinkService';
import { goalService } from '../../../../../services/goalService';
import { dailyRecordService } from '../../../../../services/dailyRecordService';
import { validationService } from '../../../../../services/validationService';
import { getApiErrorMessage } from '../../../../../utils/apiError';
import type { TrackingLink } from '../../../../../types/trackingLink';
import type { Goal } from '../../../../../types/goal';
import type { DailyRecord } from '../../../../../types/dailyRecord';
import type { Validation, ValidationRequest } from '../../../../../types/validation';
import type { PageResponse } from '../../../../../types/page';

type Partner = { id: number; username: string };

type PageState<T> = {
  page: number;
  setPage: (page: number) => void;
  data: PageResponse<T> | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
};

function partnerFromLink(link: TrackingLink, currentUserId: number): Partner {
  return link.requesterId === currentUserId
    ? { id: link.receiverId, username: link.receiverUsername }
    : { id: link.requesterId, username: link.requesterUsername };
}

function Section({ step, title, children, action }: { step: number; title: string; children: ReactNode; action?: ReactNode }) {
  const styles = useWorkflowStyles();
  return (
    <View style={styles.section}>
      <Text style={styles.step}>Step {step} of 5</Text>
      {action ? <View style={{flexDirection:'row',alignItems:'center',gap:8}}><Text style={[styles.heading,{flex:1}]}>{title}</Text>{action}</View> : <Text style={styles.heading}>{title}</Text>}
      {children}
    </View>
  );
}

function ListStatus<T>({ state, empty }: { state: PageState<T>; empty: string }) {
  const styles = useWorkflowStyles();
  const { theme: { colors: palette } } = useAppearance();
  return (
    <>
      {state.loading ? <ActivityIndicator color={palette.primary} /> : null}
      {state.error ? (
        <>
          <StatusMessage message={state.error} error />
          <ActionButton compact title="Retry" secondary onPress={state.reload} />
        </>
      ) : null}
      {!state.loading && !state.error && state.data?.empty ? <AcademicEmpty><Text style={styles.empty}>{empty}</Text></AcademicEmpty> : null}
    </>
  );
}

function RecordReview({ goalId, record, partnerName, step, onBack, onContinue, onBusyChange }: { goalId: number; record: DailyRecord; partnerName: string; step: number; onBack(): void; onContinue(): void; onBusyChange(busy: boolean): void }) {
  const styles = useWorkflowStyles();
  const { theme: { colors: palette } } = useAppearance();
  const complete = useCreationComplete();
  const [validation, setValidation] = useState<Validation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const currentRevision = useRef(revision);
  const [saving, setSaving] = useState(false);
  const [saveError,setSaveError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  useCreationBusy(saving);

  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    currentRevision.current = revision;
    const isCurrent = () => !controller.signal.aborted && currentRevision.current === revision;
    void Promise.resolve().then(async () => {
      if (!isCurrent()) return;
      setLoading(true);
      setError(null);
      setMessage(null);
      try {
        const result = await validationService.get(goalId, record.id, controller.signal);
        if (isCurrent()) setValidation(result);
      } catch (cause) {
        if (!isCurrent()) return;
        if (isAxiosError(cause) && cause.response?.status === 404) {
          setValidation(null);
        } else {
          setError(getApiErrorMessage(cause, 'Could not load the validation.'));
        }
      } finally {
        if (isCurrent()) setLoading(false);
      }
    });
    return () => controller.abort();
  }, [goalId, record.id, revision]));

  async function save(request: ValidationRequest): Promise<boolean> {
    if (saving) return false;
    setSaving(true);
    onBusyChange(true);
    setSaveError(null);
    setMessage(null);
    try {
      const result = validation
        ? await validationService.update(goalId, record.id, request)
        : await validationService.create(goalId, record.id, request);
      setValidation(result);
      setMessage(validation ? 'Validation updated.' : 'Validation created.');
      complete?.();
      return true;
    } catch (cause) {
      if (isAxiosError(cause) && cause.response?.status === 409) {
        setSaveError('This record may already have a validation. Refresh before trying again.');
      } else {
        setSaveError(getApiErrorMessage(cause, 'Could not save the validation.'));
      }
      return false;
    } finally {
      setSaving(false);
      onBusyChange(false);
    }
  }

  return <View style={{ display: step >= 3 ? 'flex' : 'none', gap: 12 }}>
    {step === 3 ? <Section step={4} title="Review evidence"><Text style={styles.meta}>{partnerName} · {record.date}</Text><Text style={styles.detail}>{record.note || 'No note provided.'}</Text><Text style={styles.detail}>{record.evidence || 'No evidence provided.'}</Text><RecordPhoto goalId={goalId} recordId={record.id} available={record.photoAvailable} readOnly/><RecordVoice goalId={goalId} recordId={record.id} available={record.voiceAvailable} readOnly/></Section> : null}
    {loading ? <ActivityIndicator color={palette.primary}/> : null}
    {error ? <><StatusMessage error message={error}/><ActionButton compact title="Reload validation" secondary onPress={() => setRevision(value => value + 1)}/></> : null}
    <View style={{ display: step === 4 ? 'flex' : 'none', gap: 12 }}>
      <Text style={styles.heading}>Confirm validation</Text>{validation ? <Text style={styles.meta}>Current decision: {validation.approved ? 'Approved' : 'Rejected'}</Text> : null}
      {message ? <StatusMessage message={message}/> : null}{saveError ? <StatusMessage error message={saveError}/> : null}
      {!loading && !error ? <ValidationEditor key={`${validation?.id ?? 'new'}-${validation?.approved ?? 'none'}-${validation?.comment ?? ''}`} initial={validation} busy={saving} onSubmit={save}/> : null}
    </View>
    <View style={styles.buttons}><ActionButton compact title="Previous step" secondary disabled={saving} onPress={onBack}/>{step === 3 ? <ActionButton compact title="Continue" disabled={loading || !!error} onPress={onContinue}/> : null}</View>
  </View>;
}

export default function Validations() {
  const focused = useIsFocused(),styles = useWorkflowStyles(); const { theme } = useAppearance(); const colors = workspacePalette(theme);
  const { currentUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [notice,setNotice] = useState<string | null>(null),[starting,setStarting] = useState(false),[step,setStep] = useState(0);
  const [partner,setPartner] = useState<Partner | null>(null),[goal,setGoal] = useState<Goal | null>(null),[record,setRecord] = useState<DailyRecord | null>(null);
  const loadPartners = useCallback((page: number, signal: AbortSignal) => trackingLinkService.active(page,signal),[]);
  const partners = usePagedResource(loadPartners,currentUser !== null);
  const loadGoals = useCallback((page: number, signal: AbortSignal) => {
    if (!partner) throw new Error('Select a partner first.');
    return goalService.list(partner.id, page, signal);
  }, [partner]);
  const goals = usePagedResource(loadGoals,!!partner);
  const loadRecords = useCallback((page: number, signal: AbortSignal) => {
    if (!goal) throw new Error('Select a goal first.');
    return dailyRecordService.list(goal.id, page, signal);
  }, [goal]);
  const records = usePagedResource(loadRecords,!!goal);
  function close() { setStarting(false); setPartner(null); setGoal(null); setRecord(null); setStep(0); }
  const menuScroll = useMenuAction('Start a validation',() => { close(); setStarting(true); },starting || partner !== null,close);
  if (!currentUser) return null;

  const flow = <View style={{ gap: 16 }}>
    <ValidationStepper step={step} busy={saving} onStep={setStep}/>
    {step === 0 ? <Section step={1} title="Tracking partners" action={<RefreshButton onPress={partners.reload} loading={partners.loading}/>}><ListStatus state={partners} empty="No active tracking partners yet."/>
      {!partners.loading && !partners.error ? partners.data?.content.map(link => { const member = partnerFromLink(link,currentUser.id); return <ValidationPartnerRow key={link.id} id={member.id} name={member.username} selected={partner?.id===member.id} onSelect={() => { if(partner?.id!==member.id){setPartner(member);setGoal(null);setRecord(null);} setStarting(true); }}/>; }) : null}
      <PageControls compact page={partners.page} totalPages={partners.data?.totalPages ?? 0} onChange={partners.setPage}/>
    </Section> : null}
    {step === 1 && partner ? <Section step={2} title={`Study goals · ${partner.username}`}><ListStatus state={goals} empty="This partner has no goals."/>{!goals.loading && !goals.error ? goals.data?.content.map(item => <NavigationPressable key={item.id} accessibilityRole="button" accessibilityLabel={`View records for ${item.topic}`} accessibilityState={{selected:goal?.id===item.id}} aria-selected={goal?.id===item.id} onPress={() => { if(goal?.id!==item.id){setGoal(item);setRecord(null);} }} style={[styles.goalRow,goal?.id===item.id&&styles.goalSelected]}>
      <DifficultyBadge value={item.difficulty} strip/>
      <View style={{flex:1,minWidth:0,padding:10,gap:4}}><Text style={styles.itemTitle}>{item.topic}</Text><Text style={styles.meta}>{item.frequency} sessions/week · {item.duration} min/session</Text></View>
      <View style={{paddingRight:8}}><AppIcon name="chevron-right" color={colors.muted} size={18}/></View>
    </NavigationPressable>) : null}<PageControls compact page={goals.page} totalPages={goals.data?.totalPages ?? 0} onChange={goals.setPage}/></Section> : null}
    {step === 2 && goal ? <Section step={3} title={`Daily records · ${goal.topic}`}><ListStatus state={records} empty="This goal has no daily records."/>{!records.loading && !records.error ? records.data?.content.map(item => <ActionButton key={item.id} compact secondary title={`Review record ${item.date}`} selected={record?.id===item.id} onPress={() => setRecord(previous => previous?.id===item.id ? previous : item)}/>) : null}<PageControls compact page={records.page} totalPages={records.data?.totalPages ?? 0} onChange={records.setPage}/></Section> : null}
    {goal && record ? <RecordReview key={`${goal.id}-${record.id}`} goalId={goal.id} record={record} partnerName={partner?.username ?? ''} step={step} onBack={() => setStep(value => value-1)} onContinue={() => setStep(4)} onBusyChange={setSaving}/> : null}
    {step < 3 ? <View style={styles.buttons}><ActionButton compact secondary title="Previous step" disabled={step===0} onPress={() => setStep(value => value-1)}/><ActionButton compact title="Continue" disabled={step===0?!partner:step===1?!goal:!record} onPress={() => setStep(value => value+1)}/></View> : null}
  </View>;
  return <>
    <CreationModal visible={focused && (starting || partner!==null)} title="New Validation" busy={saving} onClose={close} onBack={() => step>0?setStep(value=>value-1):close()} onComplete={() => {close();setNotice('Validation saved.');partners.reload();}}>{flow}</CreationModal>
    <Screen themed scrollRef={menuScroll} backgroundColor={colors.background}><AcademicHeading title="Validations" eyebrow="REVIEW PROGRESS" glyph="note" description="Review study records from your connected partners." art={<AcademicSprite name="notebook" width={50}/>}/>{notice?<StatusMessage variant="success" message={notice}/>:null}{!starting && !partner ? flow : null}</Screen>
  </>;
}
function useWorkflowStyles() { const { theme } = useAppearance(); return createStyles(workspacePalette(theme)); }

const createStyles = (palette: ThemeColors) => StyleSheet.create({
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  back: { color: palette.primary, fontSize: 16, paddingVertical: 4 },
  title: { color: palette.text, fontSize: 24, fontWeight: '800' },
  subtitle: { color: palette.muted, fontSize: 14, lineHeight: 22 },
  section: { gap: 12 },
  step: { color: palette.primary, fontSize: 12, fontWeight: '700' },
  heading: { color: palette.text, fontSize: 20, fontWeight: '700' },
  meta: { color: palette.muted, fontSize: 13, lineHeight: 20 },
  detail: { color: palette.text, fontSize: 14, lineHeight: 22 },
  label: { color: palette.muted, fontSize: 12, fontWeight: '700' },
  count: { color: palette.muted, fontSize: 12 },
  empty: { color: palette.muted, fontSize: 14, paddingVertical: 10 },
  goalRow: {flexDirection:'row',alignItems:'center',minHeight:64,borderWidth:1,borderColor:palette.border,backgroundColor:palette.surface,borderRadius:9,overflow:'hidden'},
  goalSelected: {borderColor:palette.primary,backgroundColor:palette.primarySoft},
  itemTitle: { color: palette.text, fontSize: 16, fontWeight: '700' },
  link: { color: palette.primary, fontSize: 13, fontWeight: '700' },
  current: { backgroundColor: palette.surfaceRaised, borderRadius: 12, padding: 13, gap: 6 },
});
