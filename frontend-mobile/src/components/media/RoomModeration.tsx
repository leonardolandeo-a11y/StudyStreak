import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Alert, AppState, Text, View } from 'react-native';
import { apiClient } from '../../services/apiClient';
import type { StudyRoom } from '../../services/studyRoomService';
import { ActionButton } from '../ui/ActionButton';
import { palette } from '../../constants/palette';

export function RoomModeration({room}:{room:StudyRoom}) {
    const [permissions,setPermissions]=useState<{userId:number;canPublish:boolean}[]>([]);
    const [error,setError]=useState<string|null>(null),[busy,setBusy]=useState(false);
    const endpoint=`/api/study-rooms/${room.id}/media`;
    useFocusEffect(useCallback(()=>{
        if(!room.host)return;
        const controller=new AbortController();let pending=false;
        const poll=async()=>{
            if(pending||AppState.currentState!=='active')return;pending=true;
            try{const {data}=await apiClient.get(endpoint,{signal:controller.signal});if(!controller.signal.aborted)setPermissions(data.permissions);}
            catch{if(!controller.signal.aborted)setError('Unable to refresh permissions.');}
            finally{pending=false;}
        };
        void poll();const timer=setInterval(()=>void poll(),4000);
        return ()=>{controller.abort();clearInterval(timer);};
    },[endpoint,room.host]));
    async function moderate(user:number,allowed?:boolean) {
        if(busy)return;setBusy(true);setError(null);
        try{
            if(allowed===undefined)await apiClient.delete(`${endpoint}/members/${user}`);
            else await apiClient.put(`${endpoint}/permissions/${user}`,{allowed});
            const {data}=await apiClient.get(endpoint);setPermissions(data.permissions);
        }catch{setError('Moderation failed. Refresh membership and retry.');}
        finally{setBusy(false);}
    }
    if(!room.host)return null;
    return <View style={{gap:12}}><Text style={{color:palette.text,fontWeight:'700'}}>Host controls</Text>
        {error&&<Text accessibilityRole="alert" style={{color:palette.pending}}>{error}</Text>}
        {room.members.filter(member=>!member.host).map(member=>{
            const allowed=permissions.find(item=>item.userId===member.userId)?.canPublish??false;
            return <View key={member.userId} style={{gap:8}}><Text style={{color:palette.text}}>{member.username}</Text>
                <ActionButton secondary title={allowed?'Revoke screen permission':'Allow screen sharing'} disabled={busy} onPress={()=>void moderate(member.userId,!allowed)}/>
                <ActionButton secondary title="Remove from room" disabled={busy} onPress={()=>Alert.alert('Remove participant?',member.username,[{text:'Cancel',style:'cancel'},{text:'Remove',style:'destructive',onPress:()=>void moderate(member.userId)}])}/>
            </View>;
        })}
        <Text style={{color:palette.muted}}>Permission changes disconnect media for everyone. Reconnect for fresh authorization.</Text>
    </View>;
}
