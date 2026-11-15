// Browser-only LiveKit view fixture. No SDK transport, devices or network are used.
export const Track={Source:{ScreenShare:'screen_share'}};
export const ConnectionState={Connected:'connected',Reconnecting:'reconnecting'};
export const RoomEvent=Object.fromEntries(['TrackSubscribed','TrackUnsubscribed','TrackUnpublished','TrackMuted','TrackUnmuted','LocalTrackPublished','LocalTrackUnpublished','ParticipantDisconnected','TrackSubscriptionFailed','ConnectionStateChanged','Disconnected'].map(k=>[k,k]));
let active;
const poster='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="1280" height="720" fill="#243c43"/><path d="M80 620H1200M100 80V620M100 560L320 400L540 450L760 220L1100 140" stroke="#94e8c3" stroke-width="10" fill="none"/><text x="160" y="110" fill="#f1f5f9" font-family="sans-serif" font-size="36">Simulated shared screen · layout test</text></svg>');
const track={attach(el){el.poster=poster;el.dataset.fixtureScreen='true';},detach(el){el.removeAttribute('poster');delete el.dataset.fixtureScreen;}};
const remote={name:'LunaStudy',videoTrackPublications:new Map()};
const update=present=>{remote.videoTrackPublications=present?new Map([['screen',{trackSid:'screen-3',source:Track.Source.ScreenShare,track,isMuted:false}]]):new Map();active?.emit(RoomEvent.TrackSubscribed);};
window.__roomMediaView={setScreen:update};
export class Room{
 constructor(){this.listeners=new Map();this.localParticipant={name:'Scholar',videoTrackPublications:new Map(),isScreenShareEnabled:false};this.remoteParticipants=new Map([['remote',remote]]);}
 on(event,listener){this.listeners.set(event,[...(this.listeners.get(event)||[]),listener]);return this;}
 emit(event,value){for(const fn of this.listeners.get(event)||[])fn(value);}
 async connect(){active=this;this.emit(RoomEvent.ConnectionStateChanged,ConnectionState.Connected);}
 removeAllListeners(){this.listeners.clear();}
 async disconnect(){if(active===this)active=null;}
}
