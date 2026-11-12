import { AcademicEmpty } from '../../components/academic/Academic';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { workspacePalette } from '../academic/workspacePalette';
import { useAppearance } from '../../hooks/useAppearance';
import { usePagedResource } from '../../hooks/usePagedResource';
import { tagService } from '../../services/tagService';
import type { Tag, TagRequest } from '../../types/tag';
import { getApiErrorMessage } from '../../utils/apiError';
import { ActionButton } from '../../components/ui/ActionButton';
import { StatusMessage } from '../../components/ui/StatusMessage';
import { PageControls } from '../../components/ui/PageControls';
import { CreationModal } from '../../components/ui/CreationModal';
import { NavigationPressable } from '../../components/navigation/NavigationPressable';
import { TagForm } from '../../components/tags/TagForm';
export function GoalTags({ goalId, owner, initiallyExpanded = false }: { goalId: number; owner: number; initiallyExpanded?: boolean }) {
  const valid = Number.isSafeInteger(goalId) && goalId > 0 && owner !== undefined;
  const { theme } = useAppearance(); const colors = workspacePalette(theme);
  const [expanded,setExpanded] = useState(initiallyExpanded),[query,setQuery] = useState('');
  const load = useCallback((page: number, signal: AbortSignal) => {
    if (!owner) throw new Error('Not signed in.'); return tagService.list(owner,goalId,page,signal);
  }, [owner,goalId]);
  const tags = usePagedResource(load,valid && expanded);
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
  if (!valid) return <StatusMessage error message="Invalid goal or session."/>;
  return <>
    <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface, padding: 12, gap: 10 }}>
      <NavigationPressable accessibilityRole="button" accessibilityLabel="View Tags" accessibilityState={{ expanded }} aria-expanded={expanded} onPress={() => setExpanded(value => !value)} style={{ minHeight: 48, justifyContent: 'center' }}><Text style={{ color: colors.primary, fontWeight: '700' }}>View Tags {expanded ? '⌄' : '›'}</Text></NavigationPressable>
      {expanded ? <>
        {message ? <StatusMessage variant="success" message={message}/> : null}
        {tags.loading ? <StatusMessage message="Loading tags…"/> : null}
        {tags.error ? <><StatusMessage error message={tags.error}/><ActionButton compact title="Retry tags" secondary onPress={tags.reload}/></> : null}
        {!tags.loading && tags.data?.empty ? <AcademicEmpty><Text style={{ color: colors.muted }}>No tags for this goal yet.</Text></AcademicEmpty> : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {tags.data?.content.map(tag => <View key={tag.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: 20 }}>
            <NavigationPressable accessibilityRole="button" accessibilityLabel={`Edit tag ${tag.name}`} onPress={() => { setEditor(tag); setError(null); }} style={{ minHeight: 44, justifyContent: 'center', paddingLeft: 10, maxWidth: 190 }}><Text style={{ color: colors.primary }}>{tag.name}</Text></NavigationPressable>
            <NavigationPressable accessibilityRole="button" accessibilityLabel={`Remove tag ${tag.name}`} onPress={() => { setRemoving(tag); setError(null); }} style={{ minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: colors.error }}>×</Text></NavigationPressable>
          </View>)}
          <NavigationPressable accessibilityRole="button" accessibilityLabel="Add tag" onPress={() => { setEditor('new'); setError(null); setQuery(''); }} style={{ minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: colors.primarySoft }}><Text style={{ color: colors.primary, fontSize: 24 }}>+</Text></NavigationPressable>
        </View>
        <PageControls page={tags.page} totalPages={tags.data?.totalPages ?? 0} onChange={tags.setPage}/>
      </> : null}
    </View>
    <CreationModal visible={editor !== null} title={editor === 'new' ? 'Add tag' : 'Edit tag'} busy={busy} onClose={() => setEditor(null)} cancelLabel="Close tag editor" showBack={false}>
      {editor && editor !== 'new' ? <StatusMessage message="Renaming this tag may affect other goals that use it." /> : null}
      {editor ? <TagForm key={editor === 'new' ? 'new' : editor.id} initialName={editor === 'new' ? '' : editor.name} busy={busy} onNameChange={setQuery} onSubmit={save} onCancel={() => setEditor(null)} /> : null}
      {editor === 'new' ? <><StatusMessage message="Enter an existing name to link it, or create a new label. Matches below are linked tags on this page."/>{tags.data?.content.filter(tag => tag.name.toLowerCase().includes(query.toLowerCase())).map(tag => <ActionButton compact secondary key={tag.id} title={`Edit tag ${tag.name}`} onPress={() => setEditor(tag)}/>)}</> : null}
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
