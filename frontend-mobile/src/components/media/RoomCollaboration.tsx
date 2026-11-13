import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type ComponentRef } from 'react';
import { ActivityIndicator, Modal, ScrollView, Text, View } from 'react-native';
import { useRoomCollaboration } from '../../hooks/useRoomCollaboration';
import { groupedMessage, nearChatEnd, roomReactions } from '../../features/studyRooms/collaborationState';
import type { StudyRoom } from '../../services/studyRoomService';
import { FormField } from '../ui/FormField';
import { ActionButton } from '../ui/ActionButton';
import { AppIcon } from '../ui/AppIcon';
import { NavigationPressable } from '../navigation/NavigationPressable';
import { SocialAvatar } from '../social/MemberReference';
import { useAppearance } from '../../hooks/useAppearance';
import { workspacePalette } from '../academic/workspacePalette';

export function RoomCollaboration({ room, userId, children }: { room: StudyRoom; userId?: number; children?: ReactNode }) {
    const { theme, reduceMotion } = useAppearance(), palette = workspacePalette(theme);
    const chat = useRoomCollaboration(room.id);
    const [tab, setTab] = useState<'chat' | 'participants'>('chat');
    const [picker, setPicker] = useState(false), [removing, setRemoving] = useState<string | null>(null);
    const viewport = useRef<ComponentRef<typeof ScrollView>>(null), bottom = useRef(true), armed = useRef(false), offset = useRef(0);
    const heights = useRef(new Map<string, number>()), messageViews = useRef(new Map<string, ComponentRef<typeof View>>());
    const order = useRef<string[]>([]), anchor = useRef<{ id: string; y: number } | null>(null);
    const frame = useRef<number | null>(null), restoring = useRef(false), revision = useRef(0), currentTab = useRef(tab);
    const own = chat.presence.find(person => person.userId === userId);
    const remember = useCallback(() => {
        let y = 10;
        for (const id of order.current) {
            const height = heights.current.get(id) ?? 0;
            if (y + height > offset.current + 8) { anchor.current = { id, y: y - offset.current }; return; }
            y += height + 2;
        }
    }, []);
    const earlier = () => { remember(); bottom.current = false; armed.current = false; restoring.current = true; void chat.loadEarlier(); };
    const restore = useCallback(() => {
        const run = revision.current;
        if (currentTab.current !== 'chat') return;
        if (bottom.current) { viewport.current?.scrollToEnd({ animated: false }); restoring.current = false; }
        else if (anchor.current) {
            const saved = anchor.current, inner = viewport.current?.getInnerViewRef();
            const message = messageViews.current.get(saved.id);
            if (inner && message) message.measureLayout(inner, (_x, y) => {
                if (run !== revision.current) return;
                offset.current = Math.max(0, y - saved.y);
                viewport.current?.scrollTo({ y: offset.current, animated: false }); restoring.current = false;
            }, () => { if (run === revision.current) restoring.current = false; });
            else restoring.current = false;
        } else restoring.current = false;
    }, []);
    const scheduleRestore = useCallback(() => {
        if (currentTab.current !== 'chat') return;
        revision.current++; restoring.current = true;
        if (frame.current !== null) cancelAnimationFrame(frame.current);
        frame.current = requestAnimationFrame(() => { frame.current = requestAnimationFrame(restore); });
    }, [restore]);
    useLayoutEffect(() => {
        currentTab.current = tab; order.current = chat.messages.map(message => message.id);
        if (tab === 'chat') scheduleRestore();
        else { revision.current++; if (frame.current !== null) cancelAnimationFrame(frame.current); restoring.current = false; }
    }, [chat.messages, tab, scheduleRestore]);
    useEffect(() => () => { revision.current++; if (frame.current !== null) cancelAnimationFrame(frame.current); }, []);
    return <View testID="room-collaboration" style={{ borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, borderRadius: 12, overflow: 'hidden' }}>
        <View accessibilityRole="tablist" style={{ flexDirection: 'row', padding: 4, gap: 4, borderBottomWidth: 1, borderColor: palette.border }}>
            {(['chat','participants'] as const).map(item => <NavigationPressable key={item} accessibilityRole="tab" aria-selected={tab === item} accessibilityLabel={item === 'chat' ? 'Chat' : `Participants (${room.members.length})`} accessibilityState={{ selected: tab === item }} onPress={() => setTab(item)}
                style={{ flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: tab === item ? palette.primarySoft : 'transparent' }}>
                <Text style={{ color: tab === item ? palette.primary : palette.textSecondary, fontWeight: '600', fontSize: 13 }}>{item === 'chat' ? 'Chat' : `Participants (${room.members.length})`}</Text>
            </NavigationPressable>)}
        </View>
        <View style={{ display: tab === 'chat' ? 'flex' : 'none' }}>
            {chat.error ? <View style={{ padding: 10, gap: 6 }}><Text accessibilityRole="alert" style={{ color: palette.pending }}>{chat.error}</Text><ActionButton compact secondary title="Retry chat" disabled={chat.loadingEarlier} onPress={() => { void (chat.historyError ? chat.loadEarlier() : chat.retry()); }}/></View> : null}
            <View style={{ paddingHorizontal: 10, paddingVertical: 4, minHeight: 56 }}>
                {chat.hasEarlier ? <ActionButton compact secondary title="Load earlier messages" busy={chat.loadingEarlier} onPress={earlier}/> : <View style={{ height: 48, alignItems: 'center', justifyContent: 'center' }}>{chat.loading ? <ActivityIndicator accessibilityLabel="Loading room chat" color={palette.primary}/> : <Text style={{ color: palette.muted, fontSize: 11 }}>{chat.messages.length ? 'Beginning of recent history' : 'Room conversation'}</Text>}</View>}
            </View>
            <ScrollView ref={viewport} testID="room-chat-scroll" accessibilityLabel="Room messages" nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ height: 360 }} contentContainerStyle={{ padding: 10, gap: 2 }} scrollEventThrottle={32}
                onContentSizeChange={scheduleRestore} onScrollBeginDrag={() => { armed.current = true; }} onScroll={event => {
                    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
                    if (restoring.current) return;
                    offset.current = contentOffset.y; bottom.current = nearChatEnd(contentOffset.y, layoutMeasurement.height, contentSize.height); remember();
                    if (armed.current && contentOffset.y < 32 && chat.hasEarlier && !chat.loadingEarlier) earlier();
                }}>
                {!chat.loading && !chat.messages.length && !chat.error ? <Text style={{ color: palette.muted, padding: 12 }}>No messages yet. Start the conversation.</Text> : null}
                {chat.messages.map((message, index) => {
                    const grouped = groupedMessage(chat.messages[index - 1], message);
                    return <View key={message.id} testID={`room-message-${message.id}`} ref={view => { if (view) messageViews.current.set(message.id, view); else messageViews.current.delete(message.id); }} onLayout={event => { heights.current.set(message.id, event.nativeEvent.layout.height); }} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', paddingTop: grouped ? 1 : 9 }}>
                        {!grouped ? <SocialAvatar userId={message.authorId} name={message.authorName} size={32}/> : <View style={{ width: 32 }}/>}
                        <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                            {!grouped ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: 6 }}><Text style={{ color: palette.text, fontWeight: '600', fontSize: 12 }}>{message.authorName}</Text><Text style={{ color: palette.muted, fontSize: 10 }}>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text></View> : null}
                            <Text selectable accessibilityLabel={grouped ? `${message.authorName}: ${message.text}` : undefined} style={{ color: message.removed ? palette.muted : palette.text, fontSize: 13, lineHeight: 20, fontStyle: message.removed ? 'italic' : 'normal' }}>{message.text}</Text>
                        </View>
                        {room.host && !message.removed ? <NavigationPressable accessibilityRole="button" accessibilityLabel={`Delete message by ${message.authorName}`} disabled={chat.busy} onPress={() => setRemoving(message.id)} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}><AppIcon name="trash" size={17} color={palette.error}/></NavigationPressable> : null}
                    </View>;
                })}
            </ScrollView>
            <View style={{ paddingHorizontal: 12 }}>{chat.presence.filter(person => person.handRaised || person.reaction).map(person => <Text key={person.userId} accessibilityLiveRegion="polite" style={{ color: palette.primary, fontSize: 11 }}>{room.members.find(member => member.userId === person.userId)?.username ?? 'Participant'} {person.handRaised ? '✋' : ''} {person.reaction}</Text>)}</View>
            <View style={{ padding: 12, gap: 8, borderTopWidth: 1, borderColor: palette.border }}>
                <FormField variant="subtle" editable={!chat.busy} label="Room message" multiline maxLength={1000} value={chat.text} onChangeText={chat.setText} placeholder="Message your study room…" hint={`${chat.text.length}/1000`} style={{ minHeight: 64, maxHeight: 130, backgroundColor: palette.surfaceRaised, borderColor: palette.borderStrong }}/>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                    <ActionButton compact secondary title="☺ Reactions" selected={picker} onPress={() => setPicker(value => !value)}/>
                    <ActionButton compact secondary title={own?.handRaised ? 'Lower hand' : 'Raise hand'} selected={own?.handRaised} disabled={chat.busy} onPress={() => { void chat.action('/hand', { raised: !own?.handRaised }, 'put'); }}/>
                    <ActionButton compact title="Send message" disabled={chat.busy || !chat.text.trim()} onPress={() => { bottom.current = true; void chat.send(); }}/>
                </View>
                {picker ? <View accessibilityRole="radiogroup" accessibilityLabel="Room reactions" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{roomReactions.map(reaction => <NavigationPressable key={reaction} accessibilityRole="radio" accessibilityLabel={`React ${reaction}`} aria-checked={own?.reaction === reaction} accessibilityState={{ checked: own?.reaction === reaction, disabled: chat.busy }} disabled={chat.busy} onPress={() => { void chat.action('/reaction', { reaction }); }} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: own?.reaction === reaction ? palette.primarySoft : palette.surfaceRaised }}><Text style={{ fontSize: 20 }}>{reaction}</Text></NavigationPressable>)}</View> : null}
                <Text style={{ color: palette.muted, fontSize: 10 }}>30-day history · Reactions last 10 seconds. Chat does not credit study time.</Text>
            </View>
        </View>
        <View style={{ display: tab === 'participants' ? 'flex' : 'none', padding: 12, gap: 12 }}>{children}</View>
        <Modal visible={removing !== null} transparent animationType={reduceMotion ? 'none' : 'fade'} onRequestClose={() => setRemoving(null)}>
            <View accessibilityViewIsModal style={{ flex: 1, backgroundColor: '#150e22aa', justifyContent: 'center', padding: 24 }}>
                <View style={{ backgroundColor: palette.surface, borderRadius: 12, padding: 18, gap: 12, width: '100%', maxWidth: 440, alignSelf: 'center' }}>
                    <Text accessibilityRole="header" style={{ color: palette.text, fontSize: 18, fontWeight: '600' }}>Delete this message?</Text>
                    <Text style={{ color: palette.muted }}>The message will be removed for everyone.</Text>
                    <ActionButton compact title="Confirm delete message" disabled={chat.busy} onPress={() => { if (removing) void chat.action(`/messages/${removing}`, undefined, 'delete'); setRemoving(null); }}/>
                    <ActionButton compact secondary title="Keep message" onPress={() => setRemoving(null)}/>
                </View>
            </View>
        </Modal>
    </View>;
}
