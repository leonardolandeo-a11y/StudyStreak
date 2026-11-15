import { StudyMark } from '../branding/StudyBrand';
import { useAmbientMotion } from '../auth/useAmbientMotion';
import './app-loading-screen.css';

export default function AppLoadingScreen({ message = 'Loading your study space...' }: { message?: string }) {
    const moving = useAmbientMotion();
    return <div className="app-loading-screen" role="status" aria-live="polite" aria-atomic="true" data-ambient={moving ? 'running' : 'paused'}>
        <div className="app-loading-symbol" aria-hidden="true">
            <StudyMark size={72} decorative />
            <svg className="app-loading-steam" viewBox="0 0 48 56" width="48" height="56" focusable="false">
                <path className="app-loading-trail" d="M24 54c-5-5-5-9 0-13" />
                <g className="app-loading-spiral">
                    <path d="M24 39c-10 0-17-7-17-16S14 7 23 7c8 0 14 6 14 13 0 6-5 10-11 10-4 0-7-3-7-7 0-3 2-5 5-5" />
                </g>
            </svg>
        </div>
        <p>{message}</p>
    </div>;
}
