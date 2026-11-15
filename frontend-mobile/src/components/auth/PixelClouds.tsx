import { Animated, View } from 'react-native';
// Approved Web silhouettes translated to native rectangles; each track wraps at 240 units.
export const cloudTracks = [
  { x: 45, y: 37, duration: 60000, rects: [[0,7,38,3],[7,3,24,4],[14,0,10,3]] },
  { x: 125, y: 51, duration: 75000, rects: [[0,6,35,3],[6,2,22,4],[14,0,8,2]] },
  { x: 185, y: 61, duration: 90000, rects: [[0,5,37,3],[8,2,22,3],[14,0,9,2]] },
] as const;
export function PixelClouds({ values, unit, color }: { values: Animated.Value[]; unit: number; color: string }) {
  return <>{cloudTracks.map((cloud, index) => <Animated.View key={index} testID={`scene-cloud-track-${index}`}
    style={{ position: 'absolute', transform: [{ translateX: values[index].interpolate({ inputRange: [0,1], outputRange: [0,-240*unit] }) }] }}>
    {[0,240].map(offset => <View key={offset} style={{ position: 'absolute', left: (cloud.x+offset)*unit, top: cloud.y*unit }}>
      {cloud.rects.map(([x,y,width,height], part) => <View key={part} style={{ position: 'absolute', left: x*unit, top: y*unit,
        width: width*unit, height: height*unit, backgroundColor: color }}/>) }
    </View>)}
  </Animated.View>)}</>;
}
