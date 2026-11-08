import { useRef, useState, type ComponentRef } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useAppearance } from '../../hooks/useAppearance';
import { SOUND_CATEGORIES, SOUNDSCAPES } from '../../features/focus/soundscapes';
import type { SoundCategory } from '../../features/focus/soundscapes';
import type { Soundscape } from '../../features/focus/pomodoroState';
import { NavigationPressable } from '../navigation/NavigationPressable';
import { FocusArtwork } from './FocusArtwork';

export function FocusSoundCarousel({ selected, playing, loading, ready, onChoose }: {
  selected: Soundscape; playing: boolean; loading: boolean; ready: boolean; onChoose(sound: Soundscape): void;
}) {
  const { theme, reduceMotion } = useAppearance();
  const [category, setCategory] = useState<SoundCategory | 'all'>('all');
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const sounds = SOUNDSCAPES.filter(item => category === 'all' || item.category === category);
  return <View style={{ gap: 10 }}>
    <Text accessibilityRole="header" style={{ color: theme.colors.text, fontSize: 18, fontWeight: '600' }}>Soundscapes</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }} accessibilityLabel="Sound categories">
      {SOUND_CATEGORIES.map(item => <NavigationPressable key={item.id} accessibilityRole="button" accessibilityLabel={item.label}
        accessibilityState={{ selected: category === item.id }} onPress={() => { setCategory(item.id); scroll.current?.scrollTo({ x: 0, animated: !reduceMotion }); }}
        style={{ minHeight: 44, paddingHorizontal: 10, justifyContent: 'center', borderRadius: 10,
          backgroundColor: category === item.id ? theme.colors.primarySoft : 'transparent' }}>
        <Text style={{ color: category === item.id ? theme.colors.primary : theme.colors.muted, fontSize: 13 }}>{item.label}</Text>
      </NavigationPressable>)}
    </ScrollView>
    <ScrollView ref={scroll} horizontal showsHorizontalScrollIndicator snapToInterval={156} decelerationRate="fast"
      contentContainerStyle={{ gap: 12, padding: 3 }} accessibilityLabel="Soundscape carousel">
      {sounds.map((item, index) => <NavigationPressable key={item.id} accessibilityRole="button" disabled={!ready}
        accessibilityLabel={`${selected === item.id && (playing || loading) ? 'Pause' : 'Play'} ${item.title}`}
        accessibilityHint={`${item.kind}. ${item.description}`} accessibilityState={{ selected: selected === item.id, busy: selected === item.id && loading }}
        onFocus={() => scroll.current?.scrollTo({ x: index * 156, animated: !reduceMotion })} onPress={() => onChoose(item.id)}
        style={{ width: 144, padding: 10, borderRadius: 14, gap: 8, backgroundColor: selected === item.id ? theme.colors.primarySoft : theme.colors.surface }}>
        <FocusArtwork sound={item.id} size={116} />
        <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '600' }}>{item.title}</Text>
        <Text style={{ color: theme.colors.muted, fontSize: 12 }}>{item.kind}</Text>
        <Text style={{ color: theme.colors.muted, fontSize: 12, lineHeight: 17 }}>{item.description}</Text>
        <Text style={{ color: theme.colors.primary, fontSize: 12 }}>{selected === item.id ? loading ? 'Preparing…' : playing ? 'Playing · tap to pause' : 'Selected · tap to play' : 'Play soundscape'}</Text>
      </NavigationPressable>)}
    </ScrollView>
  </View>;
}
