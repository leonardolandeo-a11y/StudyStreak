import { useEffect, useRef, useState, type ReactNode } from 'react';
import { StudyScene } from '../auth/StudyScene';
import { useStudyPeriod } from '../auth/useStudyPeriod';
import '../auth/auth.css';
import './study-environment.css';

// A bounded presentation of the existing local room, never a page background.
export function StudyEnvironment({ children, enabled = true }: { children?: ReactNode; enabled?: boolean }) {
    const period = useStudyPeriod();
    const frame = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
        if (frame.current) observer.observe(frame.current);
        return () => observer.disconnect();
    }, []);
    return <div ref={frame} className={`study-environment ${children ? 'study-environment--focus' : 'study-environment--welcome'}`}
        data-visible={visible} data-enabled={enabled}>
        {enabled ? <StudyScene key={period} period={period} /> : null}
        {enabled && children ? <div className="study-environment-shade" aria-hidden="true" /> : null}
        {children ? <div className="study-environment-content">{children}</div> : null}
        {enabled && !children ? <span className="study-environment-caption">Your study nook · {period ?? 'night'}</span> : null}
    </div>;
}
export function FocusEnvironment({ children }: { children: ReactNode }) {
    const [enabled, setEnabled] = useState(true);
    return <div className="focus-environment">
        <label className="study-ambience-control"><input type="checkbox" aria-label="Study ambience" checked={enabled} onChange={event => setEnabled(event.target.checked)} />Study ambience</label>
        <StudyEnvironment enabled={enabled}>{children}</StudyEnvironment>
    </div>;
}
