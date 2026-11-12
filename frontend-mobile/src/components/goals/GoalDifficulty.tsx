import { Text, View } from 'react-native';
import { AcademicSprite, type AcademicSpriteName } from '../academic/AcademicSprite';
import { NavigationPressable } from '../navigation/NavigationPressable';
import { useAppearance } from '../../hooks/useAppearance';
import type { GoalDifficulty } from '../../types/goal';
const levels: { value: GoalDifficulty; label: string; face: AcademicSpriteName; expression: string }[] = [
  { value: 'TRIVIAL', label: 'Intrascendente', face: 'difficultyTrivial', expression: 'Neutral' },
  { value: 'EASY', label: 'Fácil', face: 'difficultyEasy', expression: 'Alegre' },
  { value: 'INTERMEDIATE', label: 'Intermedio', face: 'difficultyIntermediate', expression: 'Seria' },
  { value: 'HARD', label: 'Difícil', face: 'difficultyHard', expression: 'Enojada' },
];
function colors(value: GoalDifficulty | null | undefined, dark: boolean) {
  const tones = { EASY: dark ? ['#a4e6b8','#203e31'] : ['#166534','#dcfce7'],
    INTERMEDIATE: dark ? ['#f3d08a','#443820'] : ['#854d0e','#fef3c7'],
    HARD: dark ? ['#ffb4b4','#4b2932'] : ['#991b1b','#fee2e2'],
    TRIVIAL: dark ? ['#cbd5e1','#38404d'] : ['#4b5563','#e5e7eb'] };
  return tones[value ?? 'TRIVIAL'] ?? tones.TRIVIAL;
}
export function DifficultyBadge({ value, strip = false }: { value?: GoalDifficulty | null; strip?: boolean }) {
  const { theme } = useAppearance();
  const [color, backgroundColor] = colors(value, theme.mode === 'dark');
  const level = levels.find(item => item.value === value);
  return <View accessible accessibilityLabel={level?.label ?? (value == null ? 'Sin dificultad' : 'Difficulty unavailable')} style={strip
    ? { width: 48, alignSelf: 'stretch', justifyContent: 'center', alignItems: 'center', backgroundColor }
    : { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor, padding: 6, borderRadius: 6, alignSelf: 'flex-start' }}>
    <AcademicSprite name={level?.face ?? 'difficultyNone'} width={strip ? 28 : 24}/>
    {!strip && <Text style={{ color, fontSize: 12 }}>{level?.label ?? (value == null ? 'Sin dificultad' : 'Difficulty unavailable')}</Text>}
  </View>;
}
export function DifficultySelector({ value, disabled, onChange }: {
  value?: GoalDifficulty | null; disabled: boolean; onChange(value: GoalDifficulty): void;
}) {
  const { theme } = useAppearance();
  return <View style={{ gap: 8 }}>
    <Text style={{ color: theme.colors.text, fontWeight: '600' }}>Difficulty</Text>
    <Text style={{ color: theme.colors.muted, fontSize: 12 }}>Your choice of effort; it does not change recorded study time.</Text>
    {!value && <Text style={{ color: theme.colors.muted, fontSize: 12 }}>Sin dificultad · choose a level to set it.</Text>}
    <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {levels.map(level => {
        const [color, backgroundColor] = colors(level.value, theme.mode === 'dark');
        return <NavigationPressable key={level.value} accessibilityRole="radio"
          accessibilityLabel={`${level.label} · ${level.expression}`} accessibilityState={{ checked: value === level.value, disabled }}
          disabled={disabled} onPress={() => onChange(level.value)}
          style={{ flexBasis: '45%', flexGrow: 1, minWidth: 130, minHeight: 52, flexDirection: 'row', gap: 6,
            alignItems: 'center', padding: 8, borderRadius: 8, backgroundColor,
            borderWidth: value === level.value ? 2 : 1, borderColor: value === level.value ? color : theme.colors.border,
            opacity: disabled ? .6 : 1 }}>
          <AcademicSprite name={level.face} width={24}/><Text style={{ flex: 1, color, fontSize: 12, fontWeight: value === level.value ? '700' : '400' }}>{level.label}{value === level.value ? ' ✓' : ''}</Text>
        </NavigationPressable>;
      })}
    </View>
  </View>;
}
