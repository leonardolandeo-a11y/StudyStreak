import { PixelGlyph } from '../academic/Academic';
import { useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { AppState, Modal, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SocialContext } from '../../contexts/SocialContext';
import { StudyPartnersSession, partnerGroup, type PartnersState } from '../../features/social/studyPartnersSession';
import { useAppearance } from '../../hooks/useAppearance';
import { OwnAvatar } from '../navigation/OwnAvatar';
import { NavigationPressable } from '../navigation/NavigationPressable';
import { PresenceLabel, describePresence } from './PresenceLabel';
import { StatusMessage } from '../ui/StatusMessage';
import { PageControls } from '../ui/PageControls';
import { AppIcon } from '../ui/AppIcon';
const empty: PartnersState = { items: [], page: 0, pages: 1, total: 0, loading: true, refreshing: false, error: null, partial: false };
const noopSubscribe = () => () => {};
const getEmpty = () => empty;
export function StudyPartnersPanel({ visible, onClose, onDismiss, onMember, onManage }: {
  visible: boolean; onClose(): void; onDismiss(): void; onMember(id: number): void; onManage(): void;
}) {
  const resources = useContext(SocialContext);
  const { reduceMotion } = useAppearance();
  const [session, setSession] = useState<StudyPartnersSession | null>(null);
  useEffect(() => {
    if (!visible || !resources) return;
    let alive = true;
    const next = new StudyPartnersSession(resources.directory);
    const active = () => next.setActive(AppState.currentState === 'active');
    active(); const listener = AppState.addEventListener('change', active);
    void Promise.resolve().then(() => { if (alive) setSession(next); });
    return () => { alive = false; listener.remove(); next.dispose(); };
  }, [visible, resources]);
  const state = useSyncExternalStore(session?.subscribe ?? noopSubscribe, session?.getSnapshot ?? getEmpty, getEmpty);
  return <Modal visible={visible} presentationStyle="pageSheet" allowSwipeDismissal animationType={reduceMotion ? 'none' : 'slide'}
    onRequestClose={onClose} onDismiss={onDismiss}>
    <StudyPartnersBody state={state} onClose={onClose} onMember={onMember} onManage={onManage}
      onRetry={() => { void session?.retry(); }} onPage={page => session?.setPage(page)} />
  </Modal>;
}

export function StudyPartnersBody({ state, onClose, onMember, onManage, onRetry, onPage }: {
  state: PartnersState; onClose(): void; onMember(id: number): void; onManage(): void; onRetry(): void; onPage(page: number): void;
}) {
  const { theme: { colors } } = useAppearance();
  return (
    <SafeAreaView accessibilityViewIsModal style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10, minHeight: 56, backgroundColor: colors.surface }}>
        <PixelGlyph name="people" size={24} />
        <Text accessibilityRole="header" style={{ flex: 1, color: colors.text, fontSize: 20, fontWeight: '600' }}>Study Partners</Text>
        <NavigationPressable accessibilityRole="button" accessibilityLabel="Close Study Partners" onPress={onClose}
          style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
          <AppIcon name="close" color={colors.muted} size={20} />
        </NavigationPressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, width: '100%', maxWidth: 600, alignSelf: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Text style={{ color: colors.muted, fontSize: 12, flex: 1 }}>{state.items.length} partners on this page</Text>
          <NavigationPressable accessibilityRole="button" accessibilityLabel="Refresh Study Partners" disabled={state.refreshing}
            onPress={() => { onRetry(); }} style={{ minHeight: 48, justifyContent: 'center', paddingHorizontal: 8 }}>
            <Text style={{ color: colors.primary, fontSize: 13 }}>Refresh</Text>
          </NavigationPressable>
        </View>
        {state.loading ? <StatusMessage message="Loading study partners…" /> : null}
        {state.error ? <><StatusMessage error message={state.error} /><NavigationPressable accessibilityRole="button" accessibilityLabel="Retry Study Partners" onPress={() => { onRetry(); }}
          style={{ minHeight: 48, justifyContent: 'center' }}><Text style={{ color: colors.primary }}>Retry</Text></NavigationPressable></> : null}
        {!state.loading && !state.error && !state.items.length ? <StatusMessage message="No accepted study partners on this page. Manage Tracking to connect." /> : null}
        {state.partial ? <StatusMessage message="Some partner details or avatars are unavailable. Refresh to retry." /> : null}
        {(['Online','Offline','Other partners'] as const).map(group => {
          const items = state.items.filter(partner => partnerGroup(partner) === group);
          if (!items.length) return null;
          return <View key={group} style={{ gap: 4 }}>
            <Text accessibilityRole="header" style={{ color: colors.muted, fontSize: 13, fontWeight: '600', paddingVertical: 6 }}>{group} · {items.length}</Text>
            {items.map(partner => {
              const description = describePresence(partner.presence);
              return <NavigationPressable key={partner.id} accessibilityRole="button" accessibilityLabel={`Open partner profile ${partner.name}`}
              accessibilityHint={`${description.label}. ${description.lastSeen ? `Last seen ${description.lastSeen}. ` : ''}Opens member profile.`}
              onPress={() => onMember(partner.id)} style={{ minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10,
                borderRadius: 8, paddingHorizontal: 4 }}>
              <OwnAvatar uri={partner.avatar} name={partner.name} size={40} />
              <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                <Text numberOfLines={1} style={{ color: colors.text, fontSize: 15, fontWeight: '600' }}>{partner.name}</Text>
                <PresenceLabel presence={partner.presence} />
                {partner.imageError ? <Text style={{ color: colors.muted, fontSize: 12 }}>Avatar unavailable</Text> : null}
              </View>
            </NavigationPressable>;
            })}
          </View>;
        })}
        <PageControls page={state.page} totalPages={state.pages} onChange={onPage} />
      </ScrollView>
      <NavigationPressable accessibilityRole="button" accessibilityLabel="Manage Tracking" onPress={onManage}
        style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center', marginHorizontal: 16, marginBottom: 8, borderRadius: 8 }}>
        <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>Manage Tracking</Text>
      </NavigationPressable>
    </SafeAreaView>
  );
}
