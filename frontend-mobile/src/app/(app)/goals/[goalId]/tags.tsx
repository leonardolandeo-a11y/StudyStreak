import { AcademicHeading, AcademicEmpty } from '../../../../components/academic/Academic';
import { useCallback, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { useAuth } from '../../../../hooks/useAuth';
import { useAppearance } from '../../../../hooks/useAppearance';
import { usePagedResource } from '../../../../hooks/usePagedResource';
import { tagService } from '../../../../services/tagService';
import type { Tag, TagRequest } from '../../../../types/tag';
import { getApiErrorMessage } from '../../../../utils/apiError';
import { Screen } from '../../../../components/ui/Screen';
import { ActionButton } from '../../../../components/ui/ActionButton';
import { StatusMessage } from '../../../../components/ui/StatusMessage';
import { PageControls } from '../../../../components/ui/PageControls';
import { CreationModal } from '../../../../components/ui/CreationModal';
import { NavigationPressable } from '../../../../components/navigation/NavigationPressable';
import { TagForm } from '../../../../components/tags/TagForm';
export default function GoalTags() {
  const { goalId: raw } = useLocalSearchParams<{ goalId: string }>();
  const goalId = Number(raw), { currentUser } = useAuth(), owner = currentUser?.id;
  const valid = Number.isSafeInteger(goalId) && goalId > 0 && owner !== undefined;
  const { theme: { colors } } = useAppearance();
  const load = useCallback((page: number, signal: AbortSignal) => {
    if (!owner) throw new Error('Not signed in.'); return tagService.list(owner,goalId,page,signal);
  }, [owner,goalId]);
  const tags = usePagedResource(load,valid);
  const [editor,setEditor] = useState<Tag | 'new' | null>(null);
  const [removing,setRemoving] = useState<Tag | null>(null);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState<string | null>(null);
  const [message,setMessage] = useState<string | null>(null);
  async function save(value: TagRequest) {
    if (!owner || !editor || busy) return false;
    setBusy(true); setError(null);
    try {
      if (editor === 'new') await tagService.create(owner,goalId,value);
      else await tagService.update(owner,goalId,editor.id,value);
      const creating = editor === 'new'; setEditor(null); setMessage(creating ? 'Tag added to this goal.' : 'Tag updated.');
      if (creating && tags.page !== 0) tags.setPage(0); else tags.reload(); return true;
    } catch(cause) { setError(getApiErrorMessage(cause,'Could not save the tag.')); return false; }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!owner || !removing || busy) return;
    setBusy(true); setError(null);
    try {
      await tagService.remove(owner,goalId,removing.id); setRemoving(null); setMessage('Tag removed from this goal.');
      if (tags.page > 0 && tags.data?.content.length === 1) tags.setPage(tags.page-1); else tags.reload();
    } catch(cause) { setError(getApiErrorMessage(cause,'Could not remove the tag.')); }
    finally { setBusy(false); }
  }
  if (!valid) return <Screen themed compact><StatusMessage error message="Invalid goal or session." /></Screen>;
  return <>
    <Screen themed compact>
      <AcademicHeading title="Goal tags" eyebrow="ORGANIZATION" glyph="note" description="Organize this goal with short labels." />
      <ActionButton compact title="Add tag" onPress={() => { setError(null); setEditor('new'); }} />
      {message ? <StatusMessage variant="success" message={message} /> : null}
      {tags.loading ? <StatusMessage message="Loading tags…" /> : null}
      {tags.error ? <><StatusMessage error message={tags.error} /><ActionButton compact title="Retry tags" secondary onPress={tags.reload} /></> : null}
      {!tags.loading && !tags.error && tags.data?.empty ? <AcademicEmpty><StatusMessage message="No tags for this goal yet." /></AcademicEmpty> : null}
      {!tags.loading && !tags.error ? tags.data?.content.map(tag => <View key={tag.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderColor: colors.border }}>
        <Text numberOfLines={2} style={{ flex: 1, color: colors.text, fontSize: 15 }}>{tag.name}</Text>
        <NavigationPressable accessibilityRole="button" accessibilityLabel={`Edit tag ${tag.name}`} onPress={() => { setError(null); setEditor(tag); }} style={{ minHeight: 48, minWidth: 48, justifyContent: 'center' }}><Text style={{ color: colors.primary }}>Edit</Text></NavigationPressable>
        <NavigationPressable accessibilityRole="button" accessibilityLabel={`Remove tag ${tag.name}`} onPress={() => { setError(null); setRemoving(tag); }} style={{ minHeight: 48, minWidth: 56, justifyContent: 'center' }}><Text style={{ color: colors.error }}>Remove</Text></NavigationPressable>
      </View>) : null}
      <PageControls page={tags.page} totalPages={tags.data?.totalPages ?? 0} onChange={tags.setPage} />
    </Screen>
    <CreationModal visible={editor !== null} title={editor === 'new' ? 'Add tag' : 'Edit tag'} busy={busy} onClose={() => setEditor(null)} cancelLabel="Close tag editor" showBack={false}>
      {editor && editor !== 'new' ? <StatusMessage message="Renaming this tag may affect other goals that use it." /> : null}
      {editor ? <TagForm key={editor === 'new' ? 'new' : editor.id} initialName={editor === 'new' ? '' : editor.name} busy={busy} onSubmit={save} onCancel={() => setEditor(null)} /> : null}
      {error ? <StatusMessage error message={error} /> : null}
    </CreationModal>
    <CreationModal visible={removing !== null} title="Remove tag" busy={busy} onClose={() => setRemoving(null)} cancelLabel="Cancel tag removal" showBack={false}>
      <Text style={{ color: colors.text }}>Remove {removing?.name} from this goal? Its other goal links are preserved.</Text>
      {error ? <StatusMessage error message={error} /> : null}
      <ActionButton compact title="Confirm remove tag" busy={busy} onPress={() => { void remove(); }} />
      <ActionButton compact title="Keep tag" secondary disabled={busy} onPress={() => setRemoving(null)} />
    </CreationModal>
  </>;
}
