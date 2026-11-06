import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Modal, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LiveKitRoom, VideoTrack, registerGlobals, useTracks, useConnectionState } from '@livekit/react-native';
import { Track } from 'livekit-client';
import { apiClient } from '../../services/apiClient';
import { ActionButton } from '../ui/ActionButton';
import { palette } from '../../constants/palette';

registerGlobals({autoConfigureAudioSession:false});
type Credentials={url:string;token:string;epoch:string};
type State={enabled:boolean;epoch:string};
function Screens() {
    const tracks=useTracks([Track.Source.ScreenShare]);
    const connection=useConnectionState();
    const [selected,setSelected]=useState<string|null>(null);
    const [maximized,setMaximized]=useState(false);
    const {width,height}=useWindowDimensions();
    const current=tracks.find(track=>track.publication?.trackSid===selected)??tracks[0];
    const name=current?.participant.name||'Participant';
    return <View style={{gap:12}}>
        <Text accessibilityLiveRegion="polite" style={{color:palette.muted}}>Media: {connection}</Text>
        {current?<>{!maximized&&<VideoTrack trackRef={current} objectFit="contain" style={{width:'100%',aspectRatio:16/9,backgroundColor:'#000'}}/>}
            <Text style={{color:palette.text}}>{name} is sharing</Text><ActionButton secondary title="Maximize screen" onPress={()=>setMaximized(true)}/></>:
            <Text style={{color:palette.muted}}>No screens shared yet.</Text>}
        <ScrollView horizontal contentContainerStyle={{gap:8}}>{tracks.map(track=><ActionButton key={track.publication?.trackSid} secondary title={track.participant.name||'Participant'} onPress={()=>setSelected(track.publication?.trackSid??null)}/>)}</ScrollView>
        <Modal visible={maximized&&!!current} onRequestClose={()=>setMaximized(false)} supportedOrientations={['portrait','landscape']}>
            <View style={{flex:1,backgroundColor:palette.background,padding:20,justifyContent:'center',gap:16}}>
                {current&&<VideoTrack trackRef={current} objectFit="contain" style={{width:width-40,height:Math.max(100,height-150),backgroundColor:'#000'}}/>}
                <ActionButton title="Close fullscreen" onPress={()=>setMaximized(false)}/>
            </View>
        </Modal>
    </View>;
}
export default function NativeRoomMedia({roomId}:{roomId:string}) {
    const [credentials,setCredentials]=useState<Credentials|null>(null);
    const [state,setState]=useState<State|null>(null);
    const [error,setError]=useState<string|null>(null);
    const [busy,setBusy]=useState(false);
    const active=useRef(false),generation=useRef(0),epoch=useRef<string|null>(null);
    const endpoint=`/api/study-rooms/${roomId}/media`;
    const disconnect=useCallback(()=>{generation.current++;epoch.current=null;setCredentials(null);setBusy(false);},[]);
    useFocusEffect(useCallback(()=>{
        active.current=true;
        return ()=>{active.current=false;disconnect();};
    },[disconnect]));
    useEffect(()=>{
        const subscription=AppState.addEventListener('change',next=>{
            if(next!=='active'){disconnect();setError('Media stopped in background. Reconnect when ready.');}
        });
        return ()=>subscription.remove();
    },[disconnect]);
    useFocusEffect(useCallback(()=>{
        const controller=new AbortController();let pending=false;
        const poll=async()=>{
            if(pending||AppState.currentState!=='active')return;pending=true;
            try {
                const {data}=await apiClient.get<State>(endpoint,{signal:controller.signal});
                if(controller.signal.aborted)return;setState(data);
                if(epoch.current&&(!data.enabled||epoch.current!==data.epoch)){
                    disconnect();setError('Permissions changed. Reconnect to the current media room.');
                }
            }catch{if(!controller.signal.aborted){disconnect();setState(null);setError('Authorization unavailable. Room closed, membership removed or network unavailable.');}}
            finally{pending=false;}
        };
        void poll();const interval=setInterval(()=>void poll(),4000);
        return ()=>{controller.abort();clearInterval(interval);};
    },[endpoint,disconnect]));
    async function connect() {
        if(busy||!state?.enabled)return;
        const attempt=++generation.current;setBusy(true);setError(null);
        try {
            const {data}=await apiClient.post<Credentials>(`${endpoint}/token?publish=false`);
            if(active.current&&AppState.currentState==='active'&&attempt===generation.current){epoch.current=data.epoch;setCredentials(data);}
        } catch {if(attempt===generation.current)setError('Unable to obtain media access. Retry after checking membership and the LiveKit server.');}
        finally {if(attempt===generation.current)setBusy(false);}
    }
    return <View style={{gap:12}}>
        {error&&<Text accessibilityRole="alert" style={{color:palette.pending}}>{error}</Text>}
        {state&&!state.enabled&&<Text style={{color:palette.muted}}>LiveKit is not configured. The study timer still works.</Text>}
        {credentials?<><LiveKitRoom key={credentials.epoch} serverUrl={credentials.url} token={credentials.token} connect audio={false} video={false} screen={false}
            options={{adaptiveStream:{pixelDensity:'screen'},dynacast:true}}
            onDisconnected={()=>{disconnect();setError('Media disconnected. Request fresh access to reconnect.');}}
            onError={()=>{disconnect();setError('Media connection failed. Check the server address and network.');}}><Screens/></LiveKitRoom>
            <ActionButton secondary title="Disconnect media" onPress={disconnect}/></>:
            <ActionButton secondary title="Connect to screens" busy={busy} disabled={!state?.enabled} onPress={()=>void connect()}/>}
        <Text style={{color:palette.muted}}>View only · no camera, microphone or recording. Media disconnects when leaving this screen or entering the background.</Text>
    </View>;
}
