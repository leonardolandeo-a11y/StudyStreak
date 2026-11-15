import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { AppState } from 'react-native';
import { createStudyPeriodSchedule, type StudyPeriod } from './studyPeriod';
export function useStudyPeriod() {
    const [period, setPeriod] = useState<StudyPeriod | null>(null);
    useFocusEffect(useCallback(() => {
        const schedule = createStudyPeriodSchedule(setPeriod);
        schedule.setActive(AppState.currentState === 'active');
        const subscription = AppState.addEventListener('change', state => schedule.setActive(state === 'active'));
        return () => { schedule.dispose(); subscription.remove(); };
    }, []));
    return period;
}
