import { Image, Switch, Text, View } from 'react-native';
import { useAppearance } from '../../hooks/useAppearance';
import { useEnvironmentPreferences } from '../../hooks/useEnvironmentPreferences';
import { defaultEnvironment, resolveEnvironment, sceneLabels, type SceneId } from '../../features/environment/environmentPreferences';
import { useStudyPeriod } from '../auth/useStudyPeriod';
import { AcademicPanel } from '../academic/Academic';
import { ActionButton } from '../ui/ActionButton';
import { NavigationPressable } from '../navigation/NavigationPressable';
import { StatusMessage } from '../ui/StatusMessage';
import { EnvironmentScene } from './EnvironmentScene';
import { sceneThumbnails } from './scenes';

export function StudyEnvironmentSettings({ userId }: { userId: number }) {
    const { theme } = useAppearance(); const colors = theme.colors;
    const { preferences, ready, error, update } = useEnvironmentPreferences(userId);
    const period = useStudyPeriod();
    const sceneId = period ? resolveEnvironment(preferences.selection,period) : null;
    return <AcademicPanel><View testID="environment-settings" style={{ gap: 12 }}>
        <Text accessibilityRole="header" style={{ color: colors.text, fontSize: 18, fontWeight: '600' }}>Study Environment</Text>
        <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>Choose the illustrated Dashboard hero. Your widgets and appearance stay unchanged.</Text>
        <ActionButton compact secondary selected={preferences.selection === 'automatic'} disabled={!ready} title="Automatic" onPress={() => { void update({ selection: 'automatic' }); }}/>
        <Text style={{ color: colors.muted, fontSize: 11, lineHeight: 17 }}>Morning: Cozy Café · Afternoon: Sunset Campus · Night: Night Desk. Uses your local time.</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {(Object.keys(sceneLabels) as SceneId[]).map(id => <NavigationPressable key={id} accessibilityRole="button" accessibilityLabel={`Select ${sceneLabels[id]}`}
                accessibilityState={{ selected: preferences.selection === id, disabled: !ready }} disabled={!ready} onPress={() => { void update({ selection: id }); }}
                style={{ width: '48%', flexGrow: 1, minWidth: 0, minHeight: 48, borderRadius: 8, overflow: 'hidden', backgroundColor: preferences.selection === id ? colors.primarySoft : colors.surfaceRaised }}>
                <View testID={`environment-thumbnail-${id}`} style={{ width: '100%', aspectRatio: 3, overflow: 'hidden' }}><Image source={sceneThumbnails[id]} fadeDuration={0} accessible={false} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} resizeMode="cover"/></View>
                <View style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, gap: 4 }}><Text style={{ flex: 1, color: colors.text, fontWeight: '600', fontSize: 12 }}>{sceneLabels[id]}</Text>
                    {preferences.selection === id ? <Text accessible={false} style={{ color: colors.primary, fontWeight: '700' }}>✓</Text> : null}
                </View>
            </NavigationPressable>)}
        </View>
        <Text accessibilityLiveRegion="polite" style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600' }}>Preview{sceneId ? ` · ${sceneLabels[sceneId]}` : ''}</Text>
        <View testID="environment-preview" style={{ borderRadius: 8, overflow: 'hidden' }}>{ready && sceneId ? <EnvironmentScene key={sceneId} sceneId={sceneId} enabled={preferences.motion}/> : <View style={{ width: '100%', aspectRatio: 3 }}/> }</View>
        <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 48, gap: 10 }}><Text style={{ flex: 1, color: colors.text, fontSize: 14 }}>Ambient movement</Text>
            <Switch accessibilityLabel="Ambient movement" value={preferences.motion} disabled={!ready} onValueChange={motion => { void update({ motion }); }} trackColor={{ false: colors.borderStrong, true: colors.primary }}/></View>
        <Text style={{ color: colors.muted, fontSize: 11, lineHeight: 17 }}>Reduce Motion and device accessibility always take priority. Rain is an illustration, not live weather.</Text>
        {error ? <><StatusMessage error message={error}/><ActionButton compact secondary title="Retry environment" onPress={() => { void update({}); }}/></> : null}
        <ActionButton compact secondary title="Restore default environment" disabled={!ready} onPress={() => { void update(defaultEnvironment()); }}/>
        <Text style={{ color: colors.muted, fontSize: 11, lineHeight: 17 }}>Selection and movement save on this device for your account only.</Text>
    </View></AcademicPanel>;
}
