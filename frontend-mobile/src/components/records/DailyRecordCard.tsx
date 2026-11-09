import { useState } from 'react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import type { DailyRecord } from '../../types/dailyRecord';
import { useAppearance } from '../../hooks/useAppearance';
import { ActionButton } from '../ui/ActionButton';
import { RecordPhoto } from './RecordPhoto';
import { RecordVoice } from './RecordVoice';
export function DailyRecordCard({ goalId, record, busy, onEdit, onRemove, onReload }: {
  goalId: number; record: DailyRecord; busy: boolean; onEdit(): void; onRemove(): void; onReload(): void;
}) {
  const { theme: { colors } } = useAppearance();
  const [evidenceOpen,setEvidenceOpen] = useState(false);
  return <View style={{ padding: 14, gap: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface }}>
    <Text accessibilityRole="header" style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>{record.date}</Text>
    <Text numberOfLines={3} style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>{record.note || 'No notes added.'}</Text>
    <Text style={{ color: colors.muted, fontSize: 12 }}>{record.photoAvailable ? 'Photo saved' : 'No photo'} · {record.voiceAvailable ? 'Voice note saved' : 'No voice note'}</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      <ActionButton compact secondary title="View record" onPress={() => router.push({ pathname: '/(app)/goals/[goalId]/records/[recordId]', params: { goalId: String(goalId), recordId: String(record.id) } })} />
      <ActionButton compact secondary title="Edit record" disabled={busy} onPress={onEdit} />
      <ActionButton compact secondary title="Delete record" disabled={busy} onPress={onRemove} />
      <ActionButton compact secondary title={evidenceOpen ? 'Hide evidence' : 'Manage evidence'} onPress={() => setEvidenceOpen(value => !value)} />
    </View>
    {evidenceOpen ? <>
      {record.evidence ? <Text style={{ color: colors.text, fontSize: 14 }}>{record.evidence}</Text> : null}
      <RecordPhoto goalId={goalId} recordId={record.id} available={record.photoAvailable} onDelete={onReload} />
      <ActionButton compact secondary title={record.photoAvailable ? 'Replace photo evidence' : 'Take evidence photo'} disabled={busy}
        onPress={() => router.push({ pathname: '/(app)/camera', params: { goalId: String(goalId), recordId: String(record.id) } })} />
      <RecordVoice goalId={goalId} recordId={record.id} available={record.voiceAvailable} onDelete={onReload} />
      <ActionButton compact secondary title={record.voiceAvailable ? 'Replace voice note' : 'Record study voice note'} disabled={busy}
        onPress={() => router.push({ pathname: '/(app)/voice', params: { goalId: String(goalId), recordId: String(record.id) } })} />
    </> : null}
  </View>;
}
