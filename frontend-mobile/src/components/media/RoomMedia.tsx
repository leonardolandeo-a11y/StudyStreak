import { Component, lazy, Suspense, useState, type ReactNode } from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform, Text, View } from 'react-native';
import { ActionButton } from '../ui/ActionButton';
import { palette } from '../../constants/palette';

// Do not evaluate the native SDK in Expo Go or before the user opens media.
const NativeMedia=lazy(()=>import('./NativeRoomMedia'));
class MediaBoundary extends Component<{children:ReactNode},{failed:boolean}> {
    state={failed:false};
    static getDerivedStateFromError() { return {failed:true}; }
    render() { return this.state.failed?<Text style={{color:palette.pending}}>Media modules unavailable. Install a compatible Expo development build. The study timer remains available.</Text>:this.props.children; }
}
export function RoomMedia({roomId}:{roomId:string}) {
    const [opened,setOpened]=useState(false);
    const compatible=Platform.OS!=='web'&&Constants.executionEnvironment!==ExecutionEnvironment.StoreClient;
    return <View style={{gap:12,paddingVertical:16}}><Text style={{color:palette.text,fontSize:20,fontWeight:'700'}}>Shared screens</Text>
        {!compatible?<Text style={{color:palette.muted}}>Screen viewing needs an Expo development build with LiveKit native modules. Expo Go is not supported.</Text>:
            opened?<MediaBoundary><Suspense fallback={<Text style={{color:palette.muted}}>Loading media modules…</Text>}><NativeMedia roomId={roomId}/></Suspense></MediaBoundary>:
                <ActionButton secondary title="Open shared screens" onPress={()=>setOpened(true)}/>}
    </View>;
}
