import { ActivityIndicator, Text, View } from 'react-native';
import { useRoomCollaboration } from '../../hooks/useRoomCollaboration';
import type { StudyRoom } from '../../services/studyRoomService';
import { FormField } from '../ui/FormField';
import { ActionButton } from '../ui/ActionButton';
import { useAppearance } from '../../hooks/useAppearance';

export function RoomCollaboration({room,userId}:{room:StudyRoom;userId?:number}) {
    const { theme: { colors: palette } } = useAppearance();
    const chat=useRoomCollaboration(room.id);
    const raised=chat.feed?.presence.find(person=>person.userId===userId)?.handRaised??false;
    return <View style={{gap:12,paddingVertical:8}}>
        <Text style={{color:palette.text,fontSize:18,fontWeight:'700'}}>Room chat</Text>
        <ActionButton compact secondary title={raised?'Lower hand':'Raise hand'} busy={chat.busy} onPress={()=>void chat.action('/hand',{raised:!raised},'put')}/>
        <View style={{flexDirection:'row',gap:8}}>{['👏','💡','✅'].map(reaction=><ActionButton compact key={reaction} secondary title={reaction} disabled={chat.busy} onPress={()=>void chat.action('/reaction',{reaction})}/>)}</View>
        {chat.feed?.presence.filter(person=>person.handRaised||person.reaction).map(person=><Text key={person.userId} style={{color:palette.primary}}>{room.members.find(member=>member.userId===person.userId)?.username??'Participant'} {person.handRaised?'✋':''} {person.reaction}</Text>)}
        {chat.loading&&<ActivityIndicator accessibilityLabel="Loading room chat" color={palette.primary}/> }
        {chat.error&&<ActionButton compact secondary title="Retry chat" disabled={chat.busy} onPress={chat.retry}/>}
        {chat.error&&<Text accessibilityRole="alert" style={{color:palette.pending}}>{chat.error}</Text>}
        {[...(chat.feed?.messages??[])].reverse().map(message=><View key={message.id} style={{padding:12,gap:8,backgroundColor:palette.surfaceRaised,borderRadius:12}}>
            <Text style={{color:palette.muted}}>{message.authorName} · {new Date(message.createdAt).toLocaleString()}</Text><Text selectable style={{color:palette.text}}>{message.text}</Text>
            {room.host&&!message.removed&&<ActionButton compact secondary title="Remove message" disabled={chat.busy} onPress={()=>void chat.action(`/messages/${message.id}`,undefined,'delete')}/>}
        </View>)}
        {chat.feed?.messages.length===0&&<Text style={{color:palette.muted}}>No messages yet.</Text>}
        <View style={{flexDirection:'row',gap:8}}><ActionButton compact secondary title="Newer" disabled={chat.page===0} onPress={()=>chat.setPage(chat.page-1)}/><ActionButton compact secondary title="Older" disabled={!chat.feed||chat.page+1>=chat.feed.totalPages} onPress={()=>chat.setPage(chat.page+1)}/></View>
        <FormField variant="subtle" editable={!chat.busy} label="Room message" multiline maxLength={1000} value={chat.text} onChangeText={chat.setText} placeholder="Message the room" />
        <ActionButton compact title="Send message" busy={chat.busy} disabled={!chat.text.trim()} onPress={()=>void chat.send()}/>
        <Text style={{color:palette.muted}}>History: 30 days · reactions: 10 seconds. Chat does not credit study time.</Text>
    </View>;
}
