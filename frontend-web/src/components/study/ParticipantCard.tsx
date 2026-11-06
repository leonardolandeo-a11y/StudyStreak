import type { ReactNode } from 'react';
export function ParticipantCard({name,host,online,studying,children}:{name:string;host:boolean;online:boolean;studying:boolean;children?:ReactNode}) {
 return <div className="flex items-start gap-3 rounded-xl border border-slate-800 p-4">
  <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 font-semibold text-lg text-emerald-200">{name.slice(0,2).toUpperCase()}</span>
  <div className="min-w-0 flex-1"><p className="break-words font-semibold text-white">{name}</p><p className="mt-1 text-xs text-slate-400">{host?'Host':'Member'} · {online?'Online':'Offline'}</p><p className={`mt-2 text-sm ${online&&studying?'text-emerald-200':'text-slate-400'}`}>{online&&studying?'Studying':!online&&studying?'Study status paused · offline':'Not studying'}</p>{children}</div>
 </div>;
}
