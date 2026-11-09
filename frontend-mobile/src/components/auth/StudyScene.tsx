import { View } from 'react-native';
import scene from './sceneData';
import type { StudyPeriod } from './studyPeriod';
export function StudyScene({ period, width }: { period: StudyPeriod | null; width: number }) {
    const unit = width / scene.width;
    return <View testID={`study-scene-${period ?? 'pending'}`} accessible={false} importantForAccessibility="no-hide-descendants"
        style={{ width, height: width * scene.height / scene.width, overflow: 'hidden', borderRadius: 6 }}>
        {period ? scene.rects.filter(row => row[5] === 'all' || row[5] === period).map(([x,y,w,h,role], index) =>
            <View key={index} accessible={false} style={{ position: 'absolute', left: x*unit, top: y*unit,
                width: w*unit, height: h*unit, backgroundColor: scene.palettes[period][role] }} />) : null}
    </View>;
}
