import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useAppearance } from '../../hooks/useAppearance';
import { workspacePalette } from '../academic/workspacePalette';
import { NavigationPressable } from '../navigation/NavigationPressable';
import { barPercent } from './chartPresentation';
type Bar = { label: string; value: number };
export function BarChart({ items, unit = 'min', label }: { items: Bar[]; unit?: string; label: string }) {
    const { theme } = useAppearance(); const colors = workspacePalette(theme);
    const [selected, setSelected] = useState<number | null>(null);
    const active = selected === null ? undefined : items[selected];
    const [expanded, setExpanded] = useState(false);
    const maximum = Math.max(0, ...items.map(item => item.value));
    const nonZero = items.filter(item => item.value > 0);
    const compressed = items.length > 4 && nonZero.length <= 4;
    const horizontal = items.length <= 4 || compressed;
    const visible = compressed ? nonZero : items;
    const caption = { color: colors.muted, fontSize: 12, lineHeight: 18 };
    const valueLabel = (item: Bar) => `${item.label}: ${item.value.toFixed(1)} ${unit}`;
    return <View style={{ gap: 10 }}>
        <Text accessibilityRole="header" style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>{label}</Text>
        <Text style={caption}>Peak {maximum.toFixed(1)} {unit}{!horizontal ? ' · Swipe to inspect all values' : ''}</Text>
        {!items.length ? <Text style={caption}>No recorded time in this period.</Text>
        : horizontal ? <View testID="recorded-chart-rows" style={{ gap: 6 }}>
            {!visible.length && <Text style={caption}>All {items.length} recorded values are zero.</Text>}
            {visible.map((item,index) => <NavigationPressable key={index} accessibilityRole="button" accessibilityLabel={valueLabel(item)} accessibilityState={{ selected: active === item }} onPress={() => setSelected(items.indexOf(item))} style={{ minHeight: 44, justifyContent: 'center', gap: 5, paddingVertical: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}><Text style={[caption,{flex:1}]}>{item.label}</Text><Text style={{ color: colors.text, fontSize: 12 }}>{item.value.toFixed(1)} {unit}</Text></View>
                <View style={{ height: 7, backgroundColor: colors.background, borderRadius: 4 }}><View style={{ height: 7, width: `${barPercent(item.value,maximum)}%`, backgroundColor: colors.primary, borderRadius: 4 }}/></View>
            </NavigationPressable>)}
            {compressed && <Text style={caption}>Non-zero values shown. Zero values remain available below.</Text>}
        </View> : <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ gap: 6 }}>
            {items.map((item,index) => <NavigationPressable key={index} accessibilityRole="button" accessibilityLabel={valueLabel(item)} accessibilityState={{ selected: active === item }} onPress={() => setSelected(items.indexOf(item))} style={{ minWidth: 44, alignItems: 'center', gap: 6, paddingBottom: 6 }}>
                <View testID="recorded-chart-column" style={{ height: 112, width: 44, justifyContent: 'flex-end', alignItems: 'center', borderBottomWidth: 1, borderColor: colors.border }}><View style={{ height: barPercent(item.value,maximum)*1.12, width: 28, backgroundColor: colors.primary, borderTopLeftRadius: 4, borderTopRightRadius: 4 }}/></View>
                <Text style={caption}>{item.label.length>7 ? item.label.slice(5) : item.label}</Text>
            </NavigationPressable>)}
        </ScrollView>}
        {items.length > 4 && <>
            <NavigationPressable accessibilityRole="button" accessibilityLabel={`All ${items.length} recorded values`} accessibilityState={{ expanded }} onPress={() => setExpanded(value=>!value)} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>{expanded ? 'Hide' : 'All'} {items.length} recorded values</Text></NavigationPressable>
            {expanded && items.map((item,index) => <Text key={index} style={caption}>{valueLabel(item)}</Text>)}
        </>}
        {active && <Text accessibilityLiveRegion="polite" style={{ color: colors.primary, fontSize: 12 }}>{active.label} · {active.value.toFixed(1)} {unit}</Text>}
    </View>;
}
