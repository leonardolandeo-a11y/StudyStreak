import { toggleScreenCapture } from "./mediaCapture";
import { useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, Track, ConnectionState, type Participant, type TrackPublication } from 'livekit-client';
import apiClient from '../../services/apiClient';
import type { StudyRoom } from '../../services/studyRoomService';

type MediaState = { enabled: boolean; epoch: string; canPublish: boolean; permissions: {userId:number;canPublish:boolean}[] };
type Credentials = {url:string;token:string;epoch:string;canPublish:boolean};
type Screen = {id:string;name:string;publication:TrackPublication};

function ScreenVideo({screen}:{screen:Screen}) {
    const video=useRef<HTMLVideoElement>(null);
    useEffect(()=>{
        const element=video.current, track=screen.publication.track;
        if (!element || !track) return;
        track.attach(element);
        return ()=>{track.detach(element);element.srcObject=null;};
    },[screen]);
    return <video ref={video} autoPlay playsInline muted className="aspect-video w-full bg-black object-contain" aria-label={`Screen shared by ${screen.name}`}/>;
}

export function RoomMedia({room:studyRoom}:{room:StudyRoom}) {
    const [state,setState]=useState<MediaState|null>(null);
    const [status,setStatus]=useState('Not connected');
    const [error,setError]=useState<string|null>(null);
    const [connected,setConnected]=useState(false);
    const [hasConnection,setHasConnection]=useState(false);
    const [busy,setBusy]=useState(false);
    const [sharing,setSharing]=useState(false);
    const [screens,setScreens]=useState<Screen[]>([]);
    const [selected,setSelected]=useState<string|null>(null);
    const connection=useRef<Room|null>(null);
    const epoch=useRef<string|null>(null);
    const generation=useRef(0);
    const panel=useRef<HTMLDivElement>(null);
    const endpoint=`/api/study-rooms/${studyRoom.id}/media`;

    function disconnect() {
        generation.current++;
        setHasConnection(false);
        const current=connection.current; connection.current=null; epoch.current=null;
        if(current) {current.removeAllListeners();void current.disconnect(true);}
        setConnected(false);setSharing(false);setScreens([]);setBusy(false);setStatus('Disconnected');
    }
    useEffect(()=>{
        const controller=new AbortController();let pending=false;
        const poll=async()=>{
            if(pending)return;pending=true;
            try {
                const response=await apiClient.get<MediaState>(endpoint,{signal:controller.signal});
                if(controller.signal.aborted)return;
                setState(response.data);
                if(connection.current && (!response.data.enabled || epoch.current!==response.data.epoch)) {
                    disconnect();setError('Room permissions changed. Reconnect to the current media room.');
                }
            } catch {
                if(!controller.signal.aborted) {disconnect();setState(null);setError('Media authorization unavailable. The room may be closed or you may have been removed.');}
            } finally {pending=false;}
        };
        void poll();const interval=window.setInterval(()=>void poll(),4000);
        const attempts=generation;
        return ()=>{controller.abort();clearInterval(interval);attempts.current++;const current=connection.current;connection.current=null;current?.removeAllListeners();void current?.disconnect(true);};
    },[endpoint]);

    async function connect() {
        if(busy||connection.current||!state?.enabled)return;
        const attempt=++generation.current;setBusy(true);setError(null);setStatus('Connecting…');
        let media:Room|null=null;
        try {
            const {data}=await apiClient.post<Credentials>(`${endpoint}/token`);
            if(attempt!==generation.current)return;
            media=new Room({adaptiveStream:true,dynacast:true});
            const current=media;connection.current=current;setHasConnection(true);epoch.current=data.epoch;
            const refresh=()=>{
                if(connection.current!==current)return;
                const participants:Participant[]=[current.localParticipant,...current.remoteParticipants.values()];
                setScreens(participants.flatMap(participant=>[...participant.videoTrackPublications.values()]
                    .filter(publication=>publication.source===Track.Source.ScreenShare && publication.track)
                    .map(publication=>({id:publication.trackSid,name:participant.name||'Participant',publication}))));
                setSharing(current.localParticipant.isScreenShareEnabled);
            };
            current.on(RoomEvent.TrackSubscribed,refresh).on(RoomEvent.TrackUnsubscribed,refresh)
                .on(RoomEvent.LocalTrackPublished,refresh).on(RoomEvent.LocalTrackUnpublished,refresh)
                .on(RoomEvent.ParticipantDisconnected,refresh)
                .on(RoomEvent.ConnectionStateChanged,value=>{
                    if(connection.current!==current)return;
                    setConnected(value===ConnectionState.Connected);
                    setStatus(value===ConnectionState.Reconnecting?'Reconnecting…':value);
                }).on(RoomEvent.Disconnected,()=>{
                    if(connection.current===current){disconnect();setError('Media disconnected. Reconnect to request fresh authorization.');}
                });
            await current.connect(data.url,data.token);
            if(attempt!==generation.current){await current.disconnect(true);return;}
            setConnected(true);setStatus('Connected');refresh();
        } catch {if(attempt===generation.current){disconnect();setError('Could not connect to LiveKit. Check its configuration and network, then retry.');}else await media?.disconnect(true);}
        finally {if(attempt===generation.current)setBusy(false);}
    }
    async function share() {
        const current=connection.current;if(!current||!connected||busy)return;
        setBusy(true);setError(null);
        try {
            await toggleScreenCapture(current,()=>connection.current===current);
            if(connection.current!==current) await current.disconnect(true);
            else setSharing(current.localParticipant.isScreenShareEnabled);
        } catch(cause) {
            if(connection.current===current)setError(cause instanceof Error && cause.name==='NotAllowedError'
                ?'Screen selection cancelled or permission denied. Nothing is being shared.':'Screen capture unavailable. Retry from a supported secure browser.');
        } finally {if(connection.current===current)setBusy(false);}
    }
    async function moderate(user:number,allowed?:boolean) {
        setError(null);
        try {
            if(allowed===undefined)await apiClient.delete(`${endpoint}/members/${user}`);
            else await apiClient.put(`${endpoint}/permissions/${user}`,{allowed});
            disconnect();setState(null);setStatus('Updating permissions…');
        }catch{setError('Moderation failed. Refresh room membership and retry.');}
    }
    const active=screens.find(screen=>screen.id===selected)??screens[0];
    const captureSupported=typeof navigator.mediaDevices?.getDisplayMedia==='function' && window.isSecureContext;
    return <section className="study-panel space-y-4" aria-label="Shared screens">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-xl font-semibold">Shared screens</h3><p role="status" className="text-sm text-slate-400">{state&&!state.enabled?'LiveKit is not configured. The study timer remains available.':status}</p></div>
            {hasConnection?<button className="study-button" onClick={disconnect}>Disconnect media</button>:<button className="study-button" disabled={!state?.enabled||busy} onClick={()=>void connect()}>{busy?'Connecting…':'Connect to screens'}</button>}
        </div>
        {error&&<p role="alert" className="text-sm text-amber-200">{error}</p>}
        <div ref={panel} className="overflow-hidden rounded-xl bg-black">
            {active?<><ScreenVideo screen={active}/><p className="p-3 text-sm text-white">{active.name} is sharing</p></>:<p className="flex aspect-video items-center justify-center p-6 text-center text-slate-400">{connected?'No screens shared yet.':'Connect to view shared screens.'}</p>}
        </div>
        {screens.length>0&&<div className="flex flex-wrap gap-2">{screens.map(screen=><button key={screen.id} className="study-tab" aria-pressed={active?.id===screen.id} onClick={()=>setSelected(screen.id)}>{screen.name}</button>)}<button className="study-button" onClick={()=>void panel.current?.requestFullscreen().catch(()=>setError('Fullscreen is unavailable in this browser.'))}>Fullscreen</button></div>}
        {connected&&<div className="flex flex-wrap items-center gap-3">
            {state?.canPublish?<button className="study-button" disabled={!captureSupported||busy} onClick={()=>void share()}>{sharing?'Stop sharing':'Share screen'}</button>:<p className="text-sm text-slate-400">Viewer · ask the host for permission to share.</p>}
            {sharing&&<p role="status" className="font-semibold text-emerald-200">● Your screen is visible to this room</p>}
            {!captureSupported&&state?.canPublish&&<p className="text-sm text-amber-200">Screen capture requires a supported desktop browser on HTTPS or localhost.</p>}
        </div>}
        {studyRoom.host&&state?.enabled&&<details><summary className="cursor-pointer py-3 font-semibold">Host · screen permissions</summary><div className="space-y-3">{studyRoom.members.filter(member=>!member.host).map(member=>{
            const allowed=state.permissions.find(permission=>permission.userId===member.userId)?.canPublish??false;
            return <div key={member.userId} className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 py-3"><span>{member.username}</span><div className="flex flex-wrap gap-2"><button className="study-button" onClick={()=>void moderate(member.userId,!allowed)}>{allowed?'Revoke screen permission':'Allow screen sharing'}</button><button className="study-button" onClick={()=>{if(window.confirm(`Remove ${member.username} from this room?`))void moderate(member.userId);}}>Remove</button></div></div>;
        })}</div><p className="text-xs text-slate-400">Permission changes disconnect media for everyone. Reconnect to enter the updated room.</p></details>}
        <p className="text-xs text-slate-400">Screen video only. No recording, camera or microphone. Sharing does not record study minutes.</p>
    </section>;
}
