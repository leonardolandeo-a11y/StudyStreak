import type { ThemeColors } from '../../features/appearance/theme';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useAppearance } from '../../hooks/useAppearance';
import { activityDate, activityNumber, chartGeometry, type VerifiedPeriod } from '../../features/dashboard/verifiedActivity';
import { NavigationPressable } from '../navigation/NavigationPressable';

export function ActivityPlot({ period, style, colors: override }: { period: VerifiedPeriod; style: 'bars' | 'lines'; colors?: ThemeColors }) {
  const { theme } = useAppearance();
  const colors = override ?? theme.colors;
  const [width, setWidth] = useState(260);
  const [showValues, setShowValues] = useState(false);
  const height = 160;
  const plotWidth = Math.max(width - 44, period.daily.length * 28);
  const graph = chartGeometry(period.daily.map(day => day.minutes), plotWidth, height);
  const labelStep = period.daily.length > 7 ? 5 : 1;
  return <View style={{ gap: 12 }} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
    <Text style={{ color: colors.muted, fontSize: 12 }}>Verified minutes · swipe the chart for all dates</Text>
    <View style={{ flexDirection: 'row', paddingTop: 10 }}>
      <View style={{ width: 44, height, marginTop: 4 }}>
        {[0, 1, 2, 3, 4].map(index => <Text key={index} style={{ position: 'absolute', top: height * index / 4 - 8,
          color: colors.muted, fontSize: 12 }}>{activityNumber(graph.top * (1 - index / 4))}</Text>)}
      </View>
      <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator contentContainerStyle={{ paddingTop: 4, paddingBottom: 8 }}>
        <View>
          <View accessible accessibilityRole="image" accessibilityLabel={`${style === 'bars' ? 'Bar' : 'Line'} chart, ${period.daily.length} days, ${activityNumber(period.minutes)} verified minutes. Daily values are available below.`}
            style={{ width: plotWidth, height }}>
            {[0, 1, 2, 3, 4].map(index => <View key={index} style={{ position: 'absolute', left: 0, right: 0, top: height * index / 4,
              height: 1, backgroundColor: colors.border }} />)}
            {style === 'bars' ? period.daily.map((day, index) => <View key={day.date} style={{ position: 'absolute',
              left: graph.step * index + graph.step * .2, bottom: 0, width: graph.step * .6,
              height: day.minutes === 0 ? 0 : Math.max(2, height - graph.points[index].y), backgroundColor: colors.primary,
              borderTopLeftRadius: 1, borderTopRightRadius: 1 }} />) : <>
              {graph.segments.map((segment, index) => <View key={index} style={{ position: 'absolute', left: segment.left,
                top: segment.top, width: segment.length, height: 2, backgroundColor: colors.primary,
                transform: [{ rotate: `${segment.angle}deg` }] }} />)}
              {graph.points.map((point, index) => <View key={period.daily[index].date} style={{ position: 'absolute', left: point.x - 3,
                top: point.y - 3, width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary }} />)}
            </>}
          </View>
          <View style={{ width: plotWidth, flexDirection: 'row', minHeight: 40, paddingTop: 8 }}>
            {period.daily.map((day, index) => <Text key={day.date} style={{ width: graph.step, color: colors.muted, fontSize: 12,
              textAlign: 'center' }}>{index % labelStep === 0 || index === period.daily.length - 1 ? activityDate(day.date).replace(' ', '\n') : ''}</Text>)}
          </View>
        </View>
      </ScrollView>
    </View>
    <NavigationPressable accessibilityRole="button" accessibilityLabel={showValues ? 'Hide daily values' : 'Show daily values'}
      onPress={() => setShowValues(value => !value)} style={{ alignSelf: 'flex-start', minHeight: 44,
        justifyContent: 'center', borderRadius: 8, paddingHorizontal: 4 }}>
      <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>{showValues ? 'Hide daily values' : 'Show daily values'}</Text>
    </NavigationPressable>
    {showValues ? period.daily.map(day => <View key={day.date} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8,
      justifyContent: 'space-between', borderBottomWidth: 1, borderColor: colors.border, paddingVertical: 8 }}>
      <Text style={{ color: colors.text }}>{activityDate(day.date)}</Text>
      <Text style={{ color: colors.muted }}>{activityNumber(day.minutes)} min · {day.sessions} sessions</Text>
    </View>) : null}
  </View>;
}
