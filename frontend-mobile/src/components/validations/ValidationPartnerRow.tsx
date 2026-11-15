import { useCallback } from 'react';
import { Text, View } from 'react-native';
import { useAppearance } from '../../hooks/useAppearance';
import { usePagedResource } from '../../hooks/usePagedResource';
import { goalService } from '../../services/goalService';
import { NavigationPressable } from '../navigation/NavigationPressable';
import { SocialAvatar } from '../social/MemberReference';

export function ValidationPartnerRow({ id, name, selected, onSelect }: {
  id: number; name: string; selected: boolean; onSelect(): void;
}) {
  const { theme: { colors } } = useAppearance();
  const load = useCallback((page: number, signal: AbortSignal) => goalService.list(id, page, signal), [id]);
  // Use the server's total, not the number of goals on the first page.
  const { data, loading, error } = usePagedResource(load);
  const total = data?.totalElements;
  const count = loading ? 'Loading Goals…' : error || total == null || !Number.isSafeInteger(total) || total < 0
    ? 'Goals unavailable' : `${total} ${total === 1 ? 'Goal' : 'Goals'}`;
  return <NavigationPressable accessibilityRole="button" accessibilityLabel={`Select tracking partner ${name}`}
    accessibilityState={{ selected }} aria-selected={selected} accessibilityHint={count} onPress={onSelect}
    style={{flexDirection:'row',alignItems:'center',gap:12,minHeight:64,padding:12,borderRadius:10,
      borderWidth:1,borderColor:selected?colors.primary:colors.border,backgroundColor:selected?colors.primarySoft:colors.surface}}>
    <SocialAvatar userId={id} name={name}/>
    <View style={{flex:1,minWidth:0,gap:4}}>
      <Text style={{color:colors.text,fontSize:15,fontWeight:'600'}}>{name}</Text>
      <Text accessibilityLiveRegion="polite" style={{color:colors.muted,fontSize:12}}>{count}</Text>
    </View>
  </NavigationPressable>;
}
