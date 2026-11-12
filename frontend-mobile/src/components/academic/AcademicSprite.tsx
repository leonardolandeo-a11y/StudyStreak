import { Image, Platform } from 'react-native';
import sprites from './sprites';
import images from './spriteImages';
export type AcademicSpriteName = keyof typeof sprites;
/** Rasterized from the same original source as Web; no per-pixel native Views. */
export function AcademicSprite({ name, width = 64 }: { name: AcademicSpriteName; width?: number }) {
    const sprite = sprites[name];
    const style = { width, height: width * sprite.height / sprite.width, flexShrink: 0,
        ...(Platform.OS === 'web' ? { imageRendering: 'pixelated' as const } : {}) };
    return <Image testID={`academic-sprite-${name}`} source={images[name]} style={style} resizeMode="contain" fadeDuration={0}
        accessible={false} importantForAccessibility="no-hide-descendants"/>;
}
