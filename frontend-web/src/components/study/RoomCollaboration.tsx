import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Send, Trash2, Users, MessageSquare } from 'lucide-react';
import { useRoomCollaboration } from '../../hooks/useRoomCollaboration';
import { groupedMessage, nearChatEnd, roomReactions } from '../../features/studyRooms/collaborationState';
import type { StudyRoom } from '../../services/studyRoomService';
import { TrackingAvatar } from '../trackingLinks/TrackingAvatar';

export function RoomCollaboration({ room, userId, children }: { room: StudyRoom; userId?: number; children?: ReactNode }) {
    const chat = useRoomCollaboration(room.id);
    const [tab, setTab] = useState<'chat' | 'participants'>('chat');
    const [picker, setPicker] = useState(false);
    const viewport = useRef<HTMLDivElement>(null), composer = useRef<HTMLTextAreaElement>(null);
    const bottom = useRef(true), armed = useRef(false);
    const anchor = useRef<{ id: string; top: number } | null>(null);
    const own = chat.presence.find(person => person.userId === userId);
    function remember() {
        const box = viewport.current;
        if (!box) return;
        bottom.current = nearChatEnd(box.scrollTop, box.clientHeight, box.scrollHeight);
        const message = [...box.querySelectorAll<HTMLElement>('[data-message]')].find(item => item.getBoundingClientRect().bottom > box.getBoundingClientRect().top + 8);
        anchor.current = message ? { id: message.dataset.message!, top: message.getBoundingClientRect().top - box.getBoundingClientRect().top } : null;
    }
    function earlier() { remember(); bottom.current = false; armed.current = false; void chat.loadEarlier(); }
    useLayoutEffect(() => {
        const box = viewport.current;
        if (!box || tab !== 'chat') return;
        if (bottom.current) box.scrollTop = box.scrollHeight;
        else if (anchor.current) {
            const saved = anchor.current;
            const item = [...box.querySelectorAll<HTMLElement>('[data-message]')].find(message => message.dataset.message === saved.id);
            if (item) box.scrollTop += item.getBoundingClientRect().top - box.getBoundingClientRect().top - saved.top;
        }
    }, [chat.messages, tab]);
    const send = () => { bottom.current = true; void chat.send(); };
    return <aside className="study-panel room-collaboration" aria-label="Room collaboration">
        <div className="room-tabs" role="tablist" aria-label="Room panels">
            {(['chat', 'participants'] as const).map(item => <button type="button" key={item} role="tab" id={`room-tab-${item}`} aria-controls={`room-panel-${item}`} aria-selected={tab === item} tabIndex={tab === item ? 0 : -1}
                onKeyDown={event => { if (['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? 'chat' : event.key === 'End' ? 'participants' : tab === 'chat' ? 'participants' : 'chat'; setTab(next); document.getElementById(`room-tab-${next}`)?.focus(); } }} onClick={() => setTab(item)}>
                {item === 'chat' ? <MessageSquare size={17}/> : <Users size={17}/>} {item === 'chat' ? 'Chat' : `Participants (${room.members.length})`}
            </button>)}
        </div>
        <section id="room-panel-chat" role="tabpanel" aria-labelledby="room-tab-chat" hidden={tab !== 'chat'}>
            {chat.error && <div className="room-chat-error"><p role="alert">{chat.error}</p><button type="button" className="study-button" disabled={chat.loadingEarlier} onClick={() => void (chat.historyError ? chat.loadEarlier() : chat.retry())}>Retry chat</button></div>}
            <div ref={viewport} tabIndex={0} className="room-chat-scroll" aria-label="Room messages"
                onWheel={event => { if (event.deltaY < 0) { armed.current = true; if ((viewport.current?.scrollTop ?? 0) < 32 && chat.hasEarlier) earlier(); } }}
                onTouchMove={() => { armed.current = true; }} onKeyDown={event => { if (['PageUp','Home','ArrowUp'].includes(event.key)) { armed.current = true; if ((viewport.current?.scrollTop ?? 0) < 32 && chat.hasEarlier) earlier(); } }}
                onScroll={() => { if (tab !== 'chat') return; remember(); if (armed.current && (viewport.current?.scrollTop ?? 0) < 32 && chat.hasEarlier && !chat.loadingEarlier) earlier(); }}>
                {chat.hasEarlier && <button type="button" className="room-history-access" disabled={chat.loadingEarlier} onClick={earlier}>Load earlier messages</button>}
                {chat.loading && <p role="status" className="room-chat-notice">Loading room chat…</p>}
                {!chat.loading && !chat.messages.length && !chat.error && <p className="room-chat-notice">No messages yet. Start the conversation.</p>}
                <ol aria-label="Recent messages">{chat.messages.map((message, index) => {
                    const grouped = groupedMessage(chat.messages[index - 1], message);
                    return <li key={message.id} data-message={message.id} className={`room-message ${grouped ? 'room-message-grouped' : ''}`}>
                        {!grouped ? <TrackingAvatar id={message.authorId} name={message.authorName} className="size-8 text-xs"/> : <span aria-hidden="true"/>}
                        <div className="room-message-body">
                            <div className={`room-message-meta ${grouped ? 'sr-only' : ''}`}><strong>{message.authorName}</strong><time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></div>
                            <p className={message.removed ? 'room-message-removed' : ''}>{message.text}</p>
                        </div>
                        {room.host && !message.removed && <button type="button" disabled={chat.busy} className="room-message-delete" aria-label={`Delete message by ${message.authorName}`} onClick={() => { if (window.confirm('Delete this message for everyone?')) void chat.action(`/messages/${message.id}`, undefined, 'delete').then(() => composer.current?.focus()); }}><Trash2 size={16}/></button>}
                    </li>;
                })}</ol>
            </div>
            <div className="room-reaction-status" aria-live="polite">{chat.presence.filter(person => person.handRaised || person.reaction).map(person => <span key={person.userId}>{room.members.find(member => member.userId === person.userId)?.username ?? 'Participant'} {person.handRaised ? '✋' : ''} {person.reaction}</span>)}</div>
            <form className="room-composer" onSubmit={event => { event.preventDefault(); send(); }}>
                <label htmlFor="room-message">Message <span>{chat.text.length}/1000</span></label>
                <textarea ref={composer} id="room-message" disabled={chat.busy} maxLength={1000} value={chat.text} placeholder="Message your study room…" onChange={event => chat.setText(event.target.value)}
                    onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(); } }}/>
                <div className="room-composer-tools"><button type="button" className="study-button" aria-expanded={picker} aria-controls="room-reactions" onClick={() => setPicker(value => !value)}>☺ Reactions</button>
                    <button type="button" className="study-button" disabled={chat.busy} aria-pressed={own?.handRaised ?? false} onClick={() => void chat.action('/hand', { raised: !own?.handRaised }, 'put')}>{own?.handRaised ? 'Lower hand' : 'Raise hand'}</button>
                    <button type="submit" className="study-button room-send" aria-label="Send message" disabled={chat.busy || !chat.text.trim()}><Send size={17}/></button></div>
                {picker && <div id="room-reactions" className="room-reaction-picker" aria-label="Room reactions">{roomReactions.map(reaction => <button type="button" className="study-button" key={reaction} aria-label={`React ${reaction}`} aria-pressed={own?.reaction === reaction} disabled={chat.busy} onClick={() => void chat.action('/reaction', { reaction })}>{reaction}</button>)}<span>Visible for 10 seconds</span></div>}
            </form>
            <p className="room-chat-notice" role="status">{chat.loadingEarlier ? 'Loading earlier messages…' : '30-day history · Chat does not credit study time.'}</p>
        </section>
        <section id="room-panel-participants" role="tabpanel" aria-labelledby="room-tab-participants" hidden={tab !== 'participants'} className="room-participants">{children}</section>
    </aside>;
}
