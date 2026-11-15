import { useAuth } from '../../hooks/useAuth';
import { useEnvironmentPreferences } from '../../hooks/useEnvironmentPreferences';
import { resolveEnvironment, sceneLabels } from '../../features/environment/environmentPreferences';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useStudyPeriod } from '../auth/useStudyPeriod';
import { useAmbientMotion } from '../auth/useAmbientMotion';
import { PanoramicScene } from './PanoramicScene';
import './study-environment.css';

export function StudyEnvironment({ children, username }: { children: ReactNode; username: string }) {
    const { currentUser } = useAuth();
    return currentUser ? <AccountEnvironment key={currentUser.id} userId={currentUser.id} username={username}>{children}</AccountEnvironment> : null;
}

function AccountEnvironment({ children, username, userId }: { children: ReactNode; username: string; userId: number }) {
    const period = useStudyPeriod();
    const { preferences, ready } = useEnvironmentPreferences(userId);
    const sceneId = period ? resolveEnvironment(preferences.selection,period) : null;
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
        {period && sceneId && ready ? <PanoramicScene key={sceneId} period={period} sceneId={sceneId} moving={active && visible && preferences.motion} /> : null}
        <div className="study-environment-content"><header className="cozy-hero-copy">
            <p className="cozy-hero-greeting"><span aria-hidden="true">{period === 'night' ? '☾' : '☀'}</span> Good {period === 'morning' ? 'morning' : period === 'afternoon' ? 'afternoon' : 'evening'}, {username}</p>
            {children}
        </header></div>
        {period ? <span className="panorama-caption">{sceneId ? sceneLabels[sceneId] : 'Your study nook'}<span aria-hidden="true"> · </span>Your study nook</span> : null}
    </div>;
}
