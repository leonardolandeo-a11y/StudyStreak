import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useAppearance } from '../../hooks/useAppearance';
import { NavigationPressable } from '../navigation/NavigationPressable';
import type { ProfileImageSlot } from '../../services/ownProfileService';
import type { ImageChange } from '../../features/profile/ownProfileMedia';

function ImageButton({ label, title, destructive = false, selected = false, disabled, busy = false, onPress }: {
  label: string; title: string; destructive?: boolean; selected?: boolean; disabled: boolean; busy?: boolean; onPress(): void;
}) {
  const { theme: { colors } } = useAppearance();
  const [focused, setFocused] = useState(false);
  const color = destructive ? colors.error : colors.text;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled, busy, selected }}
    disabled={disabled} onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    style={({ pressed }) => ({ minHeight: 48, justifyContent: 'center', opacity: disabled && !busy ? .45 : pressed ? .75 : 1 })}>
    <View pointerEvents="none" style={{ minHeight: 40, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8,
      borderWidth: 1, borderColor: focused ? colors.focus : destructive ? colors.errorBorder : selected ? colors.primary : colors.borderStrong,
      backgroundColor: destructive ? colors.errorSurface : 'transparent',
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      {busy ? <ActivityIndicator color={color} size="small" /> : <>
        {!destructive ? <Text accessible={false} style={{ color, fontSize: 16 }}>+</Text> : null}
        <Text style={{ color, fontSize: 13, fontWeight: '600', flexShrink: 1 }}>{title}</Text>
      </>}
    </View>
  </Pressable>;
}

export function ProfileImageControls({ slot, change, busy, picking, onSelect, onRemove, onUndo }: {
  slot: ProfileImageSlot; change: ImageChange; busy: boolean; picking: boolean; onSelect(): void; onRemove(): void; onUndo(): void;
}) {
  const { theme: { colors } } = useAppearance();
  return <View style={{ gap: 2 }}>
    <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>{slot === 'avatar' ? 'Avatar' : 'Banner'}</Text>
    <Text style={{ color: colors.muted, fontSize: 12 }}>Up to {slot === 'avatar' ? 2 : 5} MiB</Text>
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <View style={{ flex: 1 }}><ImageButton label={`Select ${slot}`} title="Select file" selected={!!change && change !== 'remove'}
        busy={picking} disabled={busy} onPress={onSelect} /></View>
      <View style={{ flex: 1 }}><ImageButton label={`Remove ${slot}`} title="Remove" destructive selected={change === 'remove'}
        disabled={busy || change === 'remove'} onPress={onRemove} /></View>
    </View>
    {change ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 12, flex: 1 }}>{change === 'remove' ? 'Will be removed when saved' : change.name}</Text>
      <NavigationPressable accessibilityRole="button" accessibilityLabel={`Undo ${slot} change`} disabled={busy} onPress={onUndo}
        style={{ minHeight: 48, minWidth: 48, justifyContent: 'center', alignItems: 'center', opacity: busy ? .45 : 1 }}>
        <Text style={{ color: colors.primary, fontSize: 13, textDecorationLine: 'underline' }}>Undo</Text>
      </NavigationPressable>
    </View> : null}
  </View>;
}
