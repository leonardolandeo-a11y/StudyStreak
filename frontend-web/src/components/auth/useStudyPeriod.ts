import { useEffect, useState } from 'react';
import { createStudyPeriodSchedule, type StudyPeriod } from './studyPeriod';
export function useStudyPeriod() {
    const [period, setPeriod] = useState<StudyPeriod | null>(null);
    useEffect(() => {
        const schedule = createStudyPeriodSchedule(setPeriod);
        const update = () => schedule.setActive(!document.hidden);
        update(); document.addEventListener('visibilitychange', update); window.addEventListener('focus', update);
        return () => { schedule.dispose(); document.removeEventListener('visibilitychange', update); window.removeEventListener('focus', update); };
    }, []);
    return period;
}
