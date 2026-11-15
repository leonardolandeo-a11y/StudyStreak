import { useCallback } from 'react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { useFocusedResource } from '../../hooks/useFocusedResource';
import { useAppearance } from '../../hooks/useAppearance';
import { socialService } from '../../services/socialService';
import { dashboardPalette } from '../academic/workspacePalette';
import { AcademicPanel } from '../academic/Academic';
import { SocialAvatar } from '../social/MemberReference';
import { NavigationPressable } from '../navigation/NavigationPressable';
import { ActionButton } from '../ui/ActionButton';
import { StatusMessage } from '../ui/StatusMessage';
export function DashboardPartners({ userId }: { userId: number }) {
    const { theme } = useAppearance(); const colors = dashboardPalette(theme);
    const load = useCallback((signal: AbortSignal) => socialService.activePage(0,signal), []);
    const { state, retry } = useFocusedResource(load);
    const links = state.status === 'success' ? state.data.content.filter(link => link.status === 'ACCEPTED' && (link.requesterId === userId || link.receiverId === userId)).slice(0,3) : [];
    return <AcademicPanel style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
        <Text accessibilityRole="header" style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>Study Partners</Text>
        <Text style={{ color: colors.muted, fontSize: 12 }}>Accepted Tracking connections · first page</Text>
        {state.status === 'loading' ? <StatusMessage colors={colors} message="Loading study partners…"/> : state.status === 'error' ? <><StatusMessage colors={colors} error message="Study partners could not be loaded."/><ActionButton colors={colors} title="Retry partners" onPress={retry}/></> : !links.length ? <StatusMessage colors={colors} message="No accepted partners on this page."/> : links.map(link => {
            const own = link.requesterId === userId, id = own ? link.receiverId : link.requesterId, name = (own ? link.receiverUsername : link.requesterUsername) || 'Member';
            return <NavigationPressable key={link.id} accessibilityRole="button" accessibilityLabel={`View profile of ${name}`} onPress={() => router.push({ pathname: '/(app)/users/[userId]/profile', params: { userId: String(id) } })} style={{ minHeight: 56, flexDirection: 'row', gap: 12, alignItems: 'center' }}><SocialAvatar userId={id} name={name} size={36}/><View style={{ flex: 1 }}><Text numberOfLines={1} style={{ color: colors.text, fontWeight: '600' }}>{name}</Text></View></NavigationPressable>;
        })}
        <ActionButton colors={colors} compact secondary title="Manage Tracking" onPress={() => router.navigate('/tracking')}/>
    </AcademicPanel>;
}
