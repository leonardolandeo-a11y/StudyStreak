import { Component, lazy, Suspense, useState, type ReactNode } from 'react';
import { isRunningInExpoGo } from 'expo';
import { NativeModules, Platform, Text, View } from 'react-native';
import { ActionButton } from '../ui/ActionButton';
import { useAppearance } from '../../hooks/useAppearance';
import { createRoomMediaLoader, supportsRoomMedia } from './roomMediaLoader';

function nativeMediaSupported(): boolean {
    try {
        // Expo's own Go detection is independent of executionEnvironment, which
        // is not proof that a binary includes LiveKit/WebRTC.
        if (isRunningInExpoGo()) return false;
        return supportsRoomMedia({ os: Platform.OS, expoGo: false,
            webRTC: NativeModules.WebRTCModule, liveKit: NativeModules.LivekitReactNativeModule });
    } catch { return false; }
}
function MediaUnavailable() {
    const { theme: { colors } } = useAppearance();
    return <Text style={{color:colors.muted}}>Screen viewing needs an Expo development build with LiveKit native modules. Expo Go is not supported. The study timer and room chat remain available.</Text>;
}
// Both render and loader must allow the runtime before importing native SDKs.
const NativeMedia = lazy(createRoomMediaLoader(nativeMediaSupported, () => import('./NativeRoomMedia'), MediaUnavailable));
class MediaBoundary extends Component<{children:ReactNode;fallback:ReactNode},{failed:boolean}> {
    state={failed:false};
    static getDerivedStateFromError() { return {failed:true}; }
    render() { return this.state.failed?this.props.fallback:this.props.children; }
}
export function RoomMedia({roomId}:{roomId:string}) {
    const { theme: { colors: palette } } = useAppearance();
    const [opened,setOpened]=useState(false);
    const compatible=nativeMediaSupported();
    return <View style={{gap:12,paddingVertical:8}}><Text style={{color:palette.text,fontSize:18,fontWeight:'700'}}>Shared screens</Text>
        {!compatible?<MediaUnavailable/>:
            opened?<MediaBoundary fallback={<MediaUnavailable/>}><Suspense fallback={<Text style={{color:palette.muted}}>Loading media modules…</Text>}><NativeMedia roomId={roomId}/></Suspense></MediaBoundary>:
                <ActionButton compact secondary title="Open shared screens" onPress={()=>setOpened(true)}/>}
    </View>;
}
