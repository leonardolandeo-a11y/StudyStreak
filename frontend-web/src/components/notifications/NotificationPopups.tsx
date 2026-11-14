import { useEffect, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useUnreadNotifications } from '../../hooks/useUnreadNotifications';
import { useToast } from '../../hooks/useToast';
import { markNotificationAsRead } from '../../services/notificationService';
import { notificationActionLabel, notificationDestination } from '../../utils/notificationDestination';
import type { Notification } from '../../types/notification';
import './notifications.css';
export function NotificationPopups() {
    const {currentUser}=useAuth(),{notices=[],dismissNotice,refreshUnreadCount}=useUnreadNotifications();
    const navigate=useNavigate(),{showToast}=useToast();
    const owner=useRef(currentUser?.id),pending=useRef(new Set<number>());
    useEffect(()=>{owner.current=currentUser?.id;return()=>{owner.current=undefined;};},[currentUser?.id]);
    async function open(note: Notification) {
        const id=currentUser?.id;if(!id||pending.current.has(note.id))return;
        pending.current.add(note.id);
        try{
            if(!note.read)await markNotificationAsRead(id,note.id);
            if(owner.current!==id)return;
            dismissNotice?.(note.id);void refreshUnreadCount();navigate(notificationDestination(note));
        }catch{if(owner.current===id)showToast('Could not open notification. Please retry.','error');}finally{pending.current.delete(note.id);}
    }
    return <aside className="notification-popups" aria-label="New notifications" aria-live="polite" aria-relevant="additions">{notices.map(note=><article key={note.id} className="notification-popup"><div className="flex items-start gap-2"><Bell size={17} className="mt-1 shrink-0 text-accent" aria-hidden="true"/><div className="min-w-0 flex-1"><h2 className="text-sm font-semibold">{note.type.toLowerCase().replaceAll('_',' ')}</h2><p className="notification-popup-summary">{note.message}</p></div><button type="button" className="study-button size-11 shrink-0 p-0" aria-label={`Dismiss notification ${note.id}`} onClick={()=>dismissNotice?.(note.id)}><X size={16} aria-hidden="true"/></button></div><button type="button" className="study-button mt-2 text-xs" onClick={()=>void open(note)}>{notificationActionLabel(note)}</button></article>)}</aside>;
}
