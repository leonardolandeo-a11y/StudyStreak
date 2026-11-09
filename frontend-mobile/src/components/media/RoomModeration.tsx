import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { AppState, Text, View } from 'react-native';
import { apiClient } from '../../services/apiClient';
import type { StudyRoom } from '../../services/studyRoomService';
import { CreationModal } from '../ui/CreationModal';
import { ActionButton } from '../ui/ActionButton';
import { useAppearance } from '../../hooks/useAppearance';

export function RoomModeration({room}:{room:StudyRoom}) {
    const { theme: { colors: palette } } = useAppearance();
    const [removing,setRemoving]=useState<number|null>(null);
    const [permissions,setPermissions]=useState<{userId:number;canPublish:boolean}[]>([]);
    const [error,setError]=useState<string|null>(null),[busy,setBusy]=useState(false);
    const endpoint=`/api/study-rooms/${room.id}/media`;
    useFocusEffect(useCallback(()=>{
        if(!room.host)return;
        const controller=new AbortController();let pending=false;
        const poll=async()=>{
            if(pending||AppState.currentState!=='active')return;pending=true;
            try{const {data}=await apiClient.get(endpoint,{signal:controller.signal});if(!controller.signal.aborted){setPermissions(data.permissions);setError(null);}}
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
                <ActionButton compact secondary title={allowed?'Revoke screen permission':'Allow screen sharing'} disabled={busy} onPress={()=>void moderate(member.userId,!allowed)}/>
                <ActionButton compact secondary title="Remove from room" disabled={busy} onPress={()=>setRemoving(member.userId)}/>
            </View>;
        })}
        <CreationModal visible={removing!==null} title="Remove participant?" showBack={false} busy={busy} cancelLabel="Cancel participant removal" onClose={()=>setRemoving(null)}>
            <Text style={{color:palette.text}}>Remove {room.members.find(member=>member.userId===removing)?.username} from this room?</Text>
            <ActionButton compact title="Confirm remove participant" busy={busy} onPress={()=>{if(removing!==null){void moderate(removing);setRemoving(null);}}}/>
            <ActionButton compact secondary title="Keep participant" disabled={busy} onPress={()=>setRemoving(null)}/>
        </CreationModal>
        <Text style={{color:palette.muted}}>Permission changes disconnect media for everyone. Reconnect for fresh authorization.</Text>
    </View>;
}
