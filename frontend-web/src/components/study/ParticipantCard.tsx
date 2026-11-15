import type { ReactNode } from 'react';
import { RoomProfileLink } from './RoomProfileLink';
export function ParticipantCard({name,host,online,studying,avatar,children,userId}:{name:string;host:boolean;online:boolean;studying:boolean;avatar?:ReactNode;children?:ReactNode;userId?:number}) {
 const identity=<>{avatar ?? <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-hover font-semibold text-lg text-accent">{name.slice(0,2).toUpperCase()}</span>}
  <div className="room-participant-info"><p className="room-participant-name" title={name}>{name}</p><p className="room-participant-role"><span data-host={host}>{host?'Host':'Member'}</span> · {online?'Connected to room':'Disconnected from room'}</p><p className={online&&studying?'room-participant-study text-success':'room-participant-study text-content-muted'}>{online&&studying?'Studying':!online&&studying?'Study status paused · disconnected':'Not studying'}</p></div>
 </>;
 return <div data-room-participant className="room-participant-card">
  {userId === undefined ? <div className="room-participant-identity">{identity}</div> : <RoomProfileLink id={userId} name={name}>{identity}</RoomProfileLink>}
  {children && <div className="room-participant-actions">{children}</div>}
 </div>;
}
