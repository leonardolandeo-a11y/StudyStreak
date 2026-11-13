import { useEffect, useId, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useEnvironmentPreferences } from '../../hooks/useEnvironmentPreferences';
import { defaultEnvironment, resolveEnvironment, sceneLabels, type SceneId } from '../../features/environment/environmentPreferences';
import { useStudyPeriod } from '../auth/useStudyPeriod';
import { useAmbientMotion } from '../auth/useAmbientMotion';
import { PanoramicScene } from './PanoramicScene';
import { sceneThumbnail } from './scenes';
import './study-environment.css';

export function StudyEnvironmentSettings({ userId }: { userId: number }) {
    const { preferences, ready, error, update } = useEnvironmentPreferences(userId);
    const period = useStudyPeriod();
    const active = useAmbientMotion();
    const group = useId();
    const preview = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        if (typeof IntersectionObserver === 'undefined') return;
        const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
        if (preview.current) observer.observe(preview.current);
        return () => observer.disconnect();
    }, []);
    const sceneId = period ? resolveEnvironment(preferences.selection,period) : null;
    return <section className="environment-settings space-y-4 border-t border-outline pt-5" aria-labelledby={`${group}-title`}>
        <div><h3 id={`${group}-title`} className="text-lg font-semibold">Study Environment</h3><p className="mt-1 text-sm text-content-secondary">Choose the illustrated Dashboard hero. Your widgets and appearance stay unchanged.</p></div>
        <fieldset disabled={!ready} className="min-w-0 space-y-3">
            <legend className="sr-only">Illustrated environment</legend>
            <label className="environment-automatic flex min-h-11 cursor-pointer items-start gap-3 rounded-control border border-outline p-3">
                <input type="radio" name={group} value="automatic" checked={preferences.selection === 'automatic'} onChange={() => update({ selection: 'automatic' })} className="mt-1 size-5 shrink-0 accent-accent"/>
                <span><span className="font-semibold">Automatic</span><span className="mt-1 block text-xs text-content-muted">Morning: Cozy Café · Afternoon: Sunset Campus · Night: Night Desk. Uses your local time.</span></span>
            </label>
            <div className="environment-options">{(Object.keys(sceneLabels) as SceneId[]).map(id => <label key={id} className="environment-option">
                <input type="radio" name={group} value={id} checked={preferences.selection === id} onChange={() => update({ selection: id })} className="sr-only"/>
                <span className="environment-option-surface" data-selected={preferences.selection === id}>
                    <img src={sceneThumbnail(id)} width="432" height="144" alt="" loading="lazy" decoding="async" onError={event => { event.currentTarget.style.visibility = 'hidden'; }}/>
                    <span className="environment-option-label"><span>{sceneLabels[id]}</span><span aria-hidden="true">{preferences.selection === id ? '✓' : ''}</span></span>
                </span>
            </label>)}</div>
        </fieldset>
        <figure className="min-w-0">
            <figcaption className="mb-2 text-sm font-semibold" aria-live="polite">Preview{sceneId ? ` · ${sceneLabels[sceneId]}` : ''}</figcaption>
            <div ref={preview} className="environment-preview" data-environment-preview>
                {ready && period && sceneId ? <PanoramicScene key={sceneId} sceneId={sceneId} period={period} moving={active && visible && preferences.motion}/> : null}
            </div>
        </figure>
        <label className="flex min-h-11 cursor-pointer items-center gap-3"><input type="checkbox" checked={preferences.motion} disabled={!ready} onChange={event => update({ motion: event.target.checked })} className="size-5 accent-accent"/><span>Ambient movement</span></label>
        <p className="text-xs text-content-muted">Motion pauses off-screen and in background. Reduce Motion and device accessibility always take priority. Rain is an illustration, not live weather.</p>
        {error && <p role="alert" className="text-sm text-danger">{error} <button type="button" className="study-button ml-2" onClick={() => update({})}>Retry environment</button></p>}
        <button type="button" className="study-button" disabled={!ready} onClick={() => update(defaultEnvironment())}><RotateCcw size={16} aria-hidden="true"/>Restore default environment</button>
        <p className="text-xs text-content-muted">Selection and movement save on this browser for your account only.</p>
    </section>;
}
