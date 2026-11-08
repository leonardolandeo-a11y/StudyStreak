import { useState, type ComponentProps } from 'react';
import { Pressable } from 'react-native';
import { useAppearance } from '../../hooks/useAppearance';

export function NavigationPressable(props: ComponentProps<typeof Pressable>) {
  const [focused, setFocused] = useState(false);
  const { theme } = useAppearance();
  return <Pressable {...props} onFocus={event => { setFocused(true); props.onFocus?.(event); }}
    onBlur={event => { setFocused(false); props.onBlur?.(event); }}
    style={state => [typeof props.style === 'function' ? props.style(state) : props.style,
      { borderWidth: 2, borderColor: focused ? theme.colors.focus : 'transparent',
        outlineWidth: focused ? 2 : 0, outlineColor: theme.colors.focus, outlineOffset: 1 }]} />;
}
