import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useStudyPeriod } from '../auth/useStudyPeriod';
import { useAmbientMotion } from '../auth/useAmbientMotion';
import { PanoramicScene } from './PanoramicScene';
import './study-environment.css';

export function StudyEnvironment({ children, username }: { children: ReactNode; username: string }) {
    const period = useStudyPeriod();
    const active = useAmbientMotion();
    const frame = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        if (typeof IntersectionObserver === 'undefined') return;
        const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
        if (frame.current) observer.observe(frame.current);
        return () => observer.disconnect();
    }, []);
    return <div ref={frame} className="study-environment study-environment--welcome" data-visible={visible}>
        {period ? <PanoramicScene key={period} period={period} moving={active && visible} /> : null}
        <div className="study-environment-content"><header className="cozy-hero-copy">
            <p className="cozy-hero-greeting"><span aria-hidden="true">{period === 'night' ? '☾' : '☀'}</span> Good {period === 'morning' ? 'morning' : period === 'afternoon' ? 'afternoon' : 'evening'}, {username}</p>
            {children}
        </header></div>
        {period ? <span className="panorama-caption">{period === 'morning' ? 'Morning light' : period === 'afternoon' ? 'Golden afternoon' : 'After hours'}<span aria-hidden="true"> · </span>Your study nook</span> : null}
    </div>;
}
