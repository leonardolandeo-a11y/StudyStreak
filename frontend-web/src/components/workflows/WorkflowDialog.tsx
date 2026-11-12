import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
export function WorkflowDialog({ title, busy = false, onClose, children }: { title: string; busy?: boolean; onClose(): void; children: ReactNode }) {
    const dialog = useRef<HTMLDialogElement>(null), id = useId();
    useEffect(() => {
        const trigger = document.activeElement as HTMLElement | null;
        dialog.current?.showModal();
        return () => { if (trigger?.isConnected) trigger.focus(); };
    }, []);
    return <dialog ref={dialog} aria-labelledby={id} className="workflow-dialog" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
        <header className="flex items-center justify-between gap-3 border-b border-outline px-5 py-3"><h2 id={id} className="text-xl font-bold">{title}</h2><button type="button" className="study-button size-11 p-0" aria-label="Close dialog" disabled={busy} onClick={onClose}><X size={20}/></button></header>
        <div className="p-5">{children}</div>
    </dialog>;
}
