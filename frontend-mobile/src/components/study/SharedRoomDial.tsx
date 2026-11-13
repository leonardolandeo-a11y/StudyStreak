import { useState } from 'react';
import { Text, View } from 'react-native';
import { useAppearance } from '../../hooks/useAppearance';
import { workspacePalette } from '../academic/workspacePalette';
import { roomProgress } from '../../features/studyRooms/collaborationState';
/** Presentation only; time is supplied by the versioned server snapshot. */
export function SharedRoomDial({ seconds, phase, time, status }: { seconds: number; phase: 'FOCUS' | 'BREAK'; time: string; status: string }) {
    const { theme } = useAppearance(), palette = workspacePalette(theme);
    const [diameter, setDiameter] = useState(230);
    const ratio = roomProgress(seconds, phase), radius = diameter/2 - 5;
    return <View onLayout={event => setDiameter(Math.min(248, event.nativeEvent.layout.width))} style={{ alignSelf: 'stretch', alignItems: 'center' }}>
        <View testID="shared-pomodoro-circle" style={{ width: diameter, height: diameter, borderRadius: diameter/2, borderWidth: 4, borderColor: palette.border, justifyContent: 'center', alignItems: 'center' }}>
            <View accessible={false} style={{ position: 'absolute', top: -4, left: -4, width: diameter, height: diameter }}>
                {Array.from({ length: 60 }, (_, index) => {
                    const angle = index*Math.PI/30 - Math.PI/2, length = 2*Math.PI*radius/60 + 1.5;
                    return <View key={index} style={{ position: 'absolute', left: diameter/2 + Math.cos(angle)*radius - length/2, top: diameter/2 + Math.sin(angle)*radius - 2, width: length, height: 4, borderRadius: 1,
                        backgroundColor: index/60 < ratio ? palette.primary : palette.border, transform: [{ rotate: `${index*6}deg` }] }}/>;
                })}
            </View>
            <View style={{ width: '76%', alignItems: 'center', gap: 10 }}><Text style={{ color: palette.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>{phase === 'FOCUS' ? 'SHARED FOCUS' : 'GROUP BREAK'}</Text>
                <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65} accessibilityRole="timer" accessibilityLabel={`Shared timer ${time}`} style={{ color: palette.text, fontSize: Math.min(48,diameter*.2), fontWeight: '600', fontVariant: ['tabular-nums'] }}>{time}</Text>
                <Text style={{ color: palette.muted, fontSize: 11, textAlign: 'center' }}>{status}</Text></View>
        </View>
    </View>;
}
