import { useRoomCollaboration } from '../../hooks/useRoomCollaboration';
import type { StudyRoom } from '../../services/studyRoomService';

export function RoomCollaboration({room,userId}:{room:StudyRoom;userId?:number}) {
    const chat=useRoomCollaboration(room.id);
    const raised=chat.feed?.presence.find(person=>person.userId===userId)?.handRaised??false;
    return <section className="study-panel space-y-4" aria-label="Room chat">
        <h3 className="text-xl font-semibold">Room chat</h3>
        <div className="flex flex-wrap gap-2"><button className="study-button" disabled={chat.busy} aria-pressed={raised} onClick={()=>void chat.action('/hand',{raised:!raised},'put')}>{raised?'Lower hand':'Raise hand'}</button>
            {['👏','💡','✅'].map(reaction=><button key={reaction} className="study-button" aria-label={`React ${reaction}`} disabled={chat.busy} onClick={()=>void chat.action('/reaction',{reaction})}>{reaction}</button>)}</div>
        <div role="status" className="text-sm text-emerald-200">{chat.feed?.presence.filter(person=>person.handRaised||person.reaction).map(person=><p key={person.userId}>{room.members.find(member=>member.userId===person.userId)?.username??'Participant'} {person.handRaised?'✋':''} {person.reaction}</p>)}</div>
        {chat.error&&<p role="alert" className="text-amber-200">{chat.error}</p>}
        <ol className="max-h-80 space-y-3 overflow-y-auto" aria-label="Recent messages">{[...(chat.feed?.messages??[])].reverse().map(message=><li key={message.id} className="rounded-xl bg-slate-900 p-3">
            <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-400"><strong>{message.authorName}</strong><time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString()}</time></div>
            <p className="whitespace-pre-wrap break-words">{message.text}</p>{room.host&&!message.removed&&<button className="study-button mt-2" disabled={chat.busy} onClick={()=>void chat.action(`/messages/${message.id}`,undefined,'delete')}>Remove message</button>}
        </li>)}</ol>
        {chat.feed?.messages.length===0&&<p className="text-slate-400">No messages yet.</p>}
        <div className="flex gap-2"><button className="study-button" disabled={chat.page===0} onClick={()=>chat.setPage(chat.page-1)}>Newer</button><button className="study-button" disabled={!chat.feed||chat.page+1>=chat.feed.totalPages} onClick={()=>chat.setPage(chat.page+1)}>Older</button></div>
        <form onSubmit={event=>{event.preventDefault();void chat.send();}} className="space-y-2"><label htmlFor="room-message">Message · {chat.text.length}/1000</label><textarea disabled={chat.busy} id="room-message" maxLength={1000} value={chat.text} onChange={event=>chat.setText(event.target.value)} className="w-full rounded-xl border border-slate-600 bg-slate-900 p-3"/><button className="study-button" disabled={chat.busy||!chat.text.trim()}>Send message</button></form>
        <p className="text-xs text-slate-400">Recent history retained for 30 days. Reactions last 10 seconds. Chat does not credit study time.</p>
    </section>;
}
