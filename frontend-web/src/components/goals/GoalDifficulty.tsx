import { AcademicSprite, type AcademicSpriteName } from '../academic/AcademicSprite';
import type { GoalDifficulty } from '../../types/goal';
import './difficulty.css';

const levels: { value: GoalDifficulty; label: string; face: AcademicSpriteName; expression: string }[] = [
    { value: 'TRIVIAL', label: 'Intrascendente', face: 'difficultyTrivial', expression: 'Neutral' },
    { value: 'EASY', label: 'Fácil', face: 'difficultyEasy', expression: 'Alegre' },
    { value: 'INTERMEDIATE', label: 'Intermedio', face: 'difficultyIntermediate', expression: 'Seria' },
    { value: 'HARD', label: 'Difícil', face: 'difficultyHard', expression: 'Enojada' },
];
export function DifficultyBadge({ value }: { value?: GoalDifficulty | null }) {
    const level = levels.find(item => item.value === value);
    return <span className="goal-difficulty-badge" data-difficulty={value ?? 'NONE'}>
        <AcademicSprite name={level?.face ?? 'difficultyNone'} width={24}/>{level?.label ?? (value == null ? 'Sin dificultad' : 'Difficulty unavailable')}
    </span>;
}
export function DifficultyFace({ value }: { value?: GoalDifficulty | null }) {
    const level = levels.find(item => item.value === value);
    return <span className="goal-difficulty-strip" data-difficulty={value ?? 'NONE'} title={level?.label ?? (value == null ? 'Sin dificultad' : 'Difficulty unavailable')}>
        <AcademicSprite name={level?.face ?? 'difficultyNone'} width={28}/>
        <span className="sr-only">{level?.label ?? (value == null ? 'Sin dificultad' : 'Difficulty unavailable')}</span>
    </span>;
}
export function DifficultySelector({ value, disabled, required, onChange }: {
    value?: GoalDifficulty | null; disabled: boolean; required: boolean; onChange(value: GoalDifficulty): void;
}) {
    return <fieldset className="goal-difficulty-selector" disabled={disabled}>
        <legend>Difficulty</legend>
        <p className="text-xs text-content-muted">Your choice of effort; it does not change recorded study time.</p>
        {!value && !required && <p className="text-sm text-content-muted">Sin dificultad · choose a level to set it.</p>}
        <div className="difficulty-options">{levels.map(level => (
            <label key={level.value} data-difficulty={level.value} className="difficulty-option">
                <input type="radio" name="difficulty" value={level.value} checked={value === level.value}
                    required={required} onChange={() => onChange(level.value)} aria-label={`${level.label} · ${level.expression}`}/>
                <AcademicSprite name={level.face} width={24}/><span>{level.label}</span>
            </label>
        ))}</div>
    </fieldset>;
}
