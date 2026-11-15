import { useEffect, useId, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { getTags, createTag, updateTag, deleteTag } from '../../services/tagService';
import type { Tag } from '../../types/tag';
import type { PageResponse } from '../../types/page';
import { WorkflowDialog } from '../workflows/WorkflowDialog';
import PaginationControls from '../ui/PaginationControls';
import { useConfirm } from '../../hooks/useConfirm';
export function GoalTags({ userId, goalId }: { userId: number; goalId: number }) {
    const [expanded, setExpanded] = useState(false), [modal, setModal] = useState(false), [page, setPage] = useState(0), [revision, setRevision] = useState(0);
    const [data, setData] = useState<PageResponse<Tag> | null>(null), [error, setError] = useState<string | null>(null), [busy, setBusy] = useState(false);
    const [query, setQuery] = useState(''), [editing, setEditing] = useState<Tag | null>(null);
    const confirm = useConfirm(), id = useId();
    useEffect(() => {
        if (!expanded) return;
        const controller = new AbortController();
        void getTags(userId, goalId, page, 10, controller.signal).then(value => {
            if (controller.signal.aborted) return;
            if (page > 0 && page >= value.totalPages) { setPage(Math.max(0, value.totalPages - 1)); return; }
            setError(null); setData(value);
        }).catch(() => { if (!controller.signal.aborted) setError('Could not load tags.'); });
        return () => controller.abort();
    }, [expanded, userId, goalId, page, revision]);
    async function save() {
        if (busy || !query.trim() || query.trim().length > 50) return;
        setBusy(true); setError(null);
        try {
            if (editing) await updateTag(userId, goalId, editing.id, { name: query.trim() });
            else await createTag(userId, goalId, { name: query.trim() });
            setModal(false); setPage(0); setRevision(n => n + 1);
        } catch { setError('Could not save tag. Your name is retained for retry.'); }
        finally { setBusy(false); }
    }
    async function remove(tag: Tag) {
        if (busy || !await confirm({ title: 'Remove tag?', message: `Unlink “${tag.name}” from this goal? The tag remains on other goals.`, confirmLabel: 'Remove', variant: 'danger' })) return;
        setBusy(true);
        try { await deleteTag(userId, goalId, tag.id); setRevision(n => n + 1); }
        catch { setError('Could not remove tag.'); } finally { setBusy(false); }
    }
    return <section className="goal-tags">
        <button type="button" className="study-button" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(value => !value)}>View Tags</button>
        {expanded && <div id={id} className="mt-3 space-y-3">
            {error && <p role="alert" className="text-sm text-danger">{error}<button type="button" className="study-button ml-2" onClick={() => setRevision(n => n + 1)}>Retry tags</button></p>}
            {!data && !error && <p role="status">Loading tags…</p>}
            {data?.empty && <p className="text-sm text-content-muted">No tags for this goal yet.</p>}
            <div className="flex flex-wrap gap-2">{data?.content.map(tag => <span className="goal-tag-badge" key={tag.id}>{tag.name}<button type="button" disabled={busy} aria-label={`Remove tag ${tag.name}`} onClick={() => { void remove(tag); }}><X size={14}/></button></span>)}
                <button type="button" className="study-button size-11 p-0" aria-label="Add tag" onClick={() => { setQuery(''); setEditing(null); setError(null); setModal(true); }}><Plus size={18}/></button>
            </div>
            {data && data.totalPages > 1 && <PaginationControls page={page} totalPages={data.totalPages} first={data.first} last={data.last} onPrevious={() => setPage(n => n - 1)} onNext={() => setPage(n => n + 1)}/>}
        </div>}
        {modal && <WorkflowDialog title={editing ? 'Edit tag name' : 'Add or link tag'} busy={busy} onClose={() => setModal(false)}>
            <form className="workflow-form space-y-4" onSubmit={event => { event.preventDefault(); void save(); }}>
                <div><label htmlFor={`${id}-name`}>Tag name</label><input id={`${id}-name`} maxLength={50} required value={query} disabled={busy} onChange={e => setQuery(e.target.value)}/><small>{query.length}/50 · Enter an existing name to link it, or create a new label. Matches below are tags on this page.</small></div>
                {editing && <p className="text-sm text-warning">Renaming this label may affect other goals that use it.</p>}
                {!editing && <div className="flex flex-wrap gap-2" aria-label="Matching tags on this page">{data?.content.filter(tag => tag.name.toLowerCase().includes(query.toLowerCase())).map(tag => <button type="button" key={tag.id} className="goal-tag-badge" onClick={() => { setEditing(tag); setQuery(tag.name); }}>Edit {tag.name}</button>)}</div>}
                {error && <p role="alert" className="text-danger">{error}</p>}
                <div className="flex gap-2"><button className="study-button bg-accent text-on-accent" disabled={busy || !query.trim()}>{busy ? 'Saving...' : 'Save tag'}</button><button type="button" className="study-button" disabled={busy} onClick={() => setModal(false)}>Cancel</button></div>
            </form>
        </WorkflowDialog>}
    </section>;
}
