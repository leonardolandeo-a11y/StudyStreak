import { Text, View } from 'react-native';
import type { Soundscape } from '../../features/focus/pomodoroState';
const colors: Record<Soundscape, string> = {
  dream: '#6d4bd3', keys: '#c25c79', classical: '#b7904d', lofi: '#765ac7', white: '#718096', pink: '#cc779d',
  brown: '#977052', rain: '#397ab8', forest: '#30785e', ocean: '#286e94', cafe: '#9a6439', fireplace: '#aa4e30',
};
const symbols: Record<Soundscape, string> = { dream: '☾', keys: '♫', classical: '♬', lofi: '♪', white: '≈', pink: '≈', brown: '≋', rain: '☂', forest: '♧', ocean: '≈', cafe: '☕', fireplace: '✦' };
export function FocusArtwork({ sound, size = 64 }: { sound: Soundscape; size?: number }) {
  return <View accessible={false} style={{ width: size, height: size, borderRadius: 14, backgroundColor: colors[sound], alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ position: 'absolute', width: size * .72, height: size * .72, borderRadius: size / 2,
      borderWidth: 1, borderColor: '#ffffff50' }} />
    <Text accessible={false} style={{ color: '#ffffff', fontSize: size * .36 }}>{symbols[sound]}</Text>
  </View>;
}
