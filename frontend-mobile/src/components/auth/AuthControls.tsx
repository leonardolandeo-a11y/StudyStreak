import { useState, type ComponentProps } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { useAppearance } from '../../hooks/useAppearance';
import { FormField } from '../ui/FormField';

export function AuthField(props: ComponentProps<typeof FormField>) {
  const { theme: { colors } } = useAppearance();
  return <FormField {...props} variant="subtle" style={[{borderRadius:2,borderColor:colors.primary+'70'},props.style]}/>;
}
export function AuthButton({ title, onPress, busy = false, disabled = false }: {
  title: string; onPress(): void; busy?: boolean; disabled?: boolean; compact?: boolean;
}) {
  const { theme: { colors } } = useAppearance();
  const [focused,setFocused]=useState(false);
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{busy,disabled:disabled||busy}}
    disabled={disabled||busy} onPress={onPress} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
    style={({pressed})=>({minHeight:48,paddingHorizontal:12,paddingVertical:10,alignItems:'center',justifyContent:'center',borderRadius:2,
      borderWidth:2,borderBottomWidth:4,borderColor:focused?colors.focus:colors.primaryHover,backgroundColor:pressed?colors.primaryHover:colors.primary,
      opacity:disabled || busy ? .62 : 1})}>
    {busy ? <ActivityIndicator color={colors.primaryText}/> : <Text style={{color:colors.primaryText,fontSize:14,fontWeight:'700',textAlign:'center'}}>{title}</Text>}
  </Pressable>;
}
