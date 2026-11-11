import { PixelGlyph } from '../academic/Academic';
import { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { useAppearance } from '../../hooks/useAppearance';
export function BookCover({ uri, title, large = false }: { uri?: string | null; title: string; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  const { theme: { colors } } = useAppearance();
  const dimensions = { width: large ? 112 : 58, height: large ? 156 : 82 };
  return uri && !failed ? <Image source={{ uri }} accessibilityLabel={`Cover of ${title}`} resizeMode="contain"
    style={[dimensions, { borderRadius: 4, backgroundColor: colors.surfaceRaised }]} onError={() => setFailed(true)} /> :
    <View accessible accessibilityLabel={`Cover unavailable for ${title}`} style={[dimensions, { borderRadius: 4, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }]}>
      <PixelGlyph name="book" size={24} />
      <Text style={{ color: colors.muted, fontSize: 11, textAlign: 'center', padding: 4 }}>No cover</Text>
    </View>;
}
