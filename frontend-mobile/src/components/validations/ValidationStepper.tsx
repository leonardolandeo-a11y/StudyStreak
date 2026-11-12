import { useCallback, useLayoutEffect, useRef, type ComponentRef } from 'react';
import { ScrollView, Text } from 'react-native';
import { NavigationPressable } from '../navigation/NavigationPressable';
import { workspacePalette } from '../academic/workspacePalette';
import { useAppearance } from '../../hooks/useAppearance';

const steps = ['Partner', 'Goal', 'Record', 'Evidence', 'Confirm'];

export function ValidationStepper({ step, busy, onStep }: {
  step: number; busy: boolean; onStep(step: number): void;
}) {
  const { theme } = useAppearance();
  const colors = workspacePalette(theme);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const positions = useRef<number[]>([]);
  const reveal = useCallback(() => {
    scroll.current?.scrollTo({ x: Math.max(0, (positions.current[step] ?? 0) - 40), animated: false });
  }, [step]);
  useLayoutEffect(reveal, [reveal]);

  return <ScrollView ref={scroll} horizontal accessibilityLabel="Validation steps"
    contentContainerStyle={{ gap: 6 }} showsHorizontalScrollIndicator={false}
    onLayout={reveal} onContentSizeChange={reveal}>
    {steps.map((title, index) => (
      <NavigationPressable key={title} accessibilityRole="button"
        accessibilityLabel={`Step ${index + 1}: ${title}`}
        accessibilityState={{ selected: index === step, disabled: busy || index > step }}
        disabled={busy || index > step} onPress={() => onStep(index)}
        onLayout={event => { positions.current[index] = event.nativeEvent.layout.x; reveal(); }}
        style={{ minHeight: 48, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 8,
          borderWidth: 1, borderColor: index === step ? colors.primary : colors.border,
          backgroundColor: index === step ? colors.primarySoft : colors.surface }}>
        <Text style={{ color: index === step ? colors.primary : colors.muted, fontSize: 12 }}>
          {index + 1}. {title}
        </Text>
      </NavigationPressable>
    ))}
  </ScrollView>;
}
