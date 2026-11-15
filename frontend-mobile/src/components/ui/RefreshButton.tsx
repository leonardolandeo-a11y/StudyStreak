import { useAppearance } from '../../hooks/useAppearance';
import { NavigationPressable } from '../navigation/NavigationPressable';
import { AppIcon } from './AppIcon';

export function RefreshButton({ onPress, loading = false, disabled = false }: {
  onPress(): void; loading?: boolean; disabled?: boolean;
}) {
  const { theme: { colors } } = useAppearance();
  return <NavigationPressable accessibilityRole="button" accessibilityLabel="Refresh"
    accessibilityState={{ busy: loading, disabled }} aria-busy={loading} disabled={disabled} onPress={onPress}
    style={{width:44,height:44,alignItems:'center',justifyContent:'center',opacity:disabled ? .5 : 1}}>
    <AppIcon name="reload" color={colors.primary} size={22}/>
  </NavigationPressable>;
}
