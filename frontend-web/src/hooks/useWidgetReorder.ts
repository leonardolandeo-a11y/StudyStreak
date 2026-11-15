import { useRef, useState, type DragEvent, type KeyboardEvent } from 'react';
import { widgetLabels, type WidgetId, type WidgetSetting } from '../features/dashboard/widgetPreferences';

/** Reorders existing settings only; visibility and storage stay in the account store. */
export function placeWidget(rows: WidgetSetting[], source: WidgetId, target: WidgetId, after = false) {
    if (source === target || !rows.some(row => row.id === source) || !rows.some(row => row.id === target)) return rows;
    const next = rows.filter(row => row.id !== source);
    const index = next.findIndex(row => row.id === target) + (after ? 1 : 0);
    next.splice(index, 0, rows.find(row => row.id === source)!);
    return next;
}

export function useWidgetReorder(rows: WidgetSetting[], save: (rows: WidgetSetting[]) => Promise<void>) {
    const source = useRef<WidgetId | null>(null);
    const [dragging, setDragging] = useState<WidgetId | null>(null);
    const [destination, setDestination] = useState<{ id: WidgetId; after: boolean } | null>(null);
    const [announcement, setAnnouncement] = useState('');
    const cancel = () => { source.current = null; setDragging(null); setDestination(null); };
    function commit(next: WidgetSetting[], id: WidgetId) {
        if (next.every((row,index) => row.id === rows[index].id)) return;
        void save(next);
        setAnnouncement(`${widgetLabels[id]} moved to position ${next.findIndex(row => row.id === id)+1} of ${next.length}.`);
    }
    function keyboard(event: KeyboardEvent<HTMLButtonElement>, id: WidgetId) {
        if (!['ArrowUp','ArrowDown','Home','End'].includes(event.key)) return;
        event.preventDefault();
        const from = rows.findIndex(row => row.id === id);
        const to = event.key === 'Home' ? 0 : event.key === 'End' ? rows.length-1 : from+(event.key === 'ArrowUp' ? -1 : 1);
        if (to < 0 || to >= rows.length || to === from) return;
        const handle = event.currentTarget;
        commit(placeWidget(rows,id,rows[to].id,to>from),id);
        requestAnimationFrame(() => { if (handle.isConnected) handle.focus(); });
    }
    function over(event: DragEvent<HTMLElement>, id: WidgetId) {
        if (!source.current || id === source.current) return;
        event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = 'move';
        const box = event.currentTarget.getBoundingClientRect();
        const after = event.clientY > box.top+box.height/2;
        setDestination(previous => previous?.id === id && previous.after === after ? previous : {id,after});
    }
    return {
        announcement,
        announce: setAnnouncement,
        targetProps: (id: WidgetId) => ({
            'data-dragging': dragging === id || undefined,
            'data-drop': destination?.id === id ? destination.after ? 'after' : 'before' : undefined,
            onDragOver: (event: DragEvent<HTMLElement>) => over(event,id),
            onDrop: (event: DragEvent<HTMLElement>) => {
                if (!source.current) return;
                event.preventDefault(); event.stopPropagation();
                const box = event.currentTarget.getBoundingClientRect();
                commit(placeWidget(rows,source.current,id,event.clientY>box.top+box.height/2),source.current); cancel();
            },
        }),
        handleProps: (id: WidgetId) => ({
            draggable: true,
            'aria-label': `Reorder ${widgetLabels[id]}`,
            'aria-keyshortcuts': 'ArrowUp ArrowDown Home End',
            title: 'Drag to reorder. Keyboard: ↑ / ↓, Home / End.',
            onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => keyboard(event,id),
            onDragStart: (event: DragEvent<HTMLButtonElement>) => {
                source.current = id; setDragging(id); setDestination(null);
                event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain',id);
                const card = event.currentTarget.closest<HTMLElement>('[data-reorder-item]');
                if (card) event.dataTransfer.setDragImage(card,20,20);
            },
            onDragEnd: cancel,
        }),
        cancel,
    };
}
