import { View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useAppearance } from '../../hooks/useAppearance';
import { useEnvironmentPreferences } from '../../hooks/useEnvironmentPreferences';
import { resolveEnvironment } from '../../features/environment/environmentPreferences';
import { useStudyPeriod } from '../auth/useStudyPeriod';
import { EnvironmentScene } from './EnvironmentScene';

export function StudyEnvironment() {
    const { currentUser } = useAuth();
    return currentUser ? <AccountEnvironment key={currentUser.id} userId={currentUser.id}/> : null;
}
function AccountEnvironment({ userId }: { userId: number }) {
    const { theme } = useAppearance();
    const { preferences, ready } = useEnvironmentPreferences(userId);
    const period = useStudyPeriod();
    const sceneId = period ? resolveEnvironment(preferences.selection,period) : null;
    const background = theme.colors.background;
    // RN's installed native gradient support blends original artwork into the actual canvas.
    const edgeFade = `linear-gradient(90deg, ${background}, ${background}00 7%, ${background}00 93%, ${background}), linear-gradient(180deg, ${background}, ${background}00 10%, ${background}00 86%, ${background})`;
    return <View testID="study-environment" style={{ marginHorizontal: -18 }}>
        <View testID={`study-scene-${period ?? 'pending'}`}>
            {ready && sceneId ? <EnvironmentScene key={sceneId} sceneId={sceneId} enabled={preferences.motion} fallbackColor={theme.colors.muted}/> : <View style={{ width: '100%', aspectRatio: 3 }}/>}
        </View>
        <View testID="environment-edge-fade" pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants"
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundImage: edgeFade }}/>
    </View>;
}
