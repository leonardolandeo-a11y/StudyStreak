import { useSearchParams } from 'react-router-dom';
import { StudyScene } from './StudyScene';
import type { StudyPeriod } from './studyPeriod';

/** Development only: URL state never enters account or appearance preferences. */
export function DevScenePreview({ period }: { period: StudyPeriod | null }) {
    const [params, setParams] = useSearchParams();
    const requested = params.get('scene');
    const forced = requested === 'morning' || requested === 'afternoon' || requested === 'night' ? requested : null;
    return <>
        <label className="auth-scene-preview">
            Scene preview (dev)
            <select aria-label="Scene preview (development only)" value={forced ?? 'auto'} onChange={event => {
                const next = new URLSearchParams(params);
                if (event.target.value === 'auto') next.delete('scene');
                else next.set('scene', event.target.value);
                setParams(next, { replace: true });
            }}>
                <option value="auto">Auto</option>
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="night">Night</option>
            </select>
        </label>
        <StudyScene period={forced ?? period} />
    </>;
}
