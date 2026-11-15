import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useAppearance } from '../../hooks/useAppearance';
import { useEnvironmentPreferences } from '../../hooks/useEnvironmentPreferences';
import { resolveEnvironment } from '../../features/environment/environmentPreferences';
import { useStudyPeriod } from '../auth/useStudyPeriod';
import { ActionButton } from '../ui/ActionButton';
import { EnvironmentScene } from './EnvironmentScene';

export function StudyEnvironment({ username }: { username: string }) {
    const { currentUser } = useAuth();
    return currentUser ? <AccountEnvironment key={currentUser.id} userId={currentUser.id} username={username}/> : null;
}
function AccountEnvironment({ userId, username }: { userId: number; username: string }) {
    const { theme } = useAppearance();
    const { preferences, ready } = useEnvironmentPreferences(userId);
    const period = useStudyPeriod();
    const sceneId = period ? resolveEnvironment(preferences.selection,period) : null;
    return <View testID="study-environment" style={{ borderRadius: 12, overflow: 'hidden', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.borderStrong }}>
        <View testID={`study-scene-${period ?? 'pending'}`}>
            {ready && sceneId ? <EnvironmentScene key={sceneId} sceneId={sceneId} enabled={preferences.motion} fallbackColor={theme.colors.surfaceRaised}/> : <View style={{ width: '100%', aspectRatio: 3 }}/>}
        </View>
        <View style={{ padding: 16, gap: 10 }}>
            <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>{period ? `Good ${period === 'night' ? 'evening' : period}, ${username}` : `Welcome, ${username}`}</Text>
            <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: 25, fontWeight: '700', lineHeight: 30 }}>Welcome back to StudyStreak!</Text>
            <Text style={{ color: theme.colors.muted, fontSize: 13, lineHeight: 19 }}>Keep the momentum going. A few focused sessions today will take you closer to your goals.</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <View style={{ flexGrow: 1 }}><ActionButton compact title="Start focusing" onPress={() => router.navigate('/focus-studio')}/></View>
                <View style={{ flexGrow: 1 }}><ActionButton compact secondary title="Join a Study Room" onPress={() => router.navigate('/study-rooms')}/></View>
            </View>
        </View>
    </View>;
}
