import { useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { useAppearance } from '../../hooks/useAppearance';
import { dashboardPalette } from '../academic/workspacePalette';
import { AcademicPanel } from '../academic/Academic';
import { ActionButton } from '../ui/ActionButton';
import { NavigationPressable } from '../navigation/NavigationPressable';
import { defaultWidgets, moveWidget, widgetLabels, type WidgetSetting } from '../../features/dashboard/widgetPreferences';
export function CustomizeDashboard({ rows, ready, error, save }: { rows: WidgetSetting[]; ready: boolean; error: string | null; save(rows: WidgetSetting[]): Promise<void> }) {
    const { theme } = useAppearance(); const colors = dashboardPalette(theme);
    const [open, setOpen] = useState(false), [announcement, setAnnouncement] = useState('');
    return <>
        <View style={{ alignSelf: 'flex-end' }}><ActionButton compact secondary title="Customize Dashboard" disabled={!ready} onPress={() => setOpen(value => !value)}/></View>
        {error ? <View><Text accessibilityRole="alert" style={{ color: theme.colors.error }}>{error}</Text><ActionButton compact secondary title="Retry layout" onPress={() => { void save(rows); }}/></View> : null}
        {open ? <AcademicPanel style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
            <Text accessibilityRole="header" style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>Customize Dashboard</Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>Changes preview below and save on this device for your account.</Text>
            {rows.map((row,index) => <View key={row.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Switch hitSlop={8} accessibilityLabel={`Show ${widgetLabels[row.id]}`} value={row.visible} onValueChange={visible => { void save(rows.map(item => item.id === row.id ? { ...item, visible } : item)); setAnnouncement(`${widgetLabels[row.id]} ${visible ? 'shown' : 'hidden'}.`); }} trackColor={{ false: colors.borderStrong, true: colors.primary }} />
                <Text style={{ flex: 1, color: colors.text, fontSize: 13 }}>{widgetLabels[row.id]}</Text>
                {([-1,1] as const).map(direction => <NavigationPressable key={direction} accessibilityRole="button" accessibilityLabel={`Move ${widgetLabels[row.id]} ${direction < 0 ? 'up' : 'down'}`} disabled={direction < 0 ? index === 0 : index === rows.length-1}
                    onPress={() => { void save(moveWidget(rows,row.id,direction)); setAnnouncement(`${widgetLabels[row.id]} moved ${direction < 0 ? 'up' : 'down'}.`); }}
                    style={{ width: 44, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 8, opacity: (direction < 0 ? index === 0 : index === rows.length-1) ? .4 : 1 }}><Text style={{ color: colors.primary, fontSize: 22 }}>{direction < 0 ? '↑' : '↓'}</Text></NavigationPressable>)}
            </View>)}
            <Text accessibilityLiveRegion="polite" style={{ color: colors.muted, fontSize: 12 }}>{announcement}</Text>
            <ActionButton colors={colors} secondary compact title="Restore default layout" onPress={() => { void save(defaultWidgets()); setAnnouncement('Default layout restored.'); }}/>
            <ActionButton colors={colors} compact title="Done customizing" onPress={() => setOpen(false)}/>
        </AcademicPanel> : null}
    </>;
}
