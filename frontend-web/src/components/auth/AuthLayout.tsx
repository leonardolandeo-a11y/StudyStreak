import type { ReactNode } from 'react';
import { StudyBrand } from '../branding/StudyBrand';
import { StudyScene } from './StudyScene';
import { useStudyPeriod } from './useStudyPeriod';
import './auth.css';
const descriptions = { morning: 'A fresh page for a new day.', afternoon: 'A little focus goes a long way.', night: 'A quiet space for your next chapter.' };
export function AuthLayout({ title, description, children, footer }: { title: string; description: string; children: ReactNode; footer: ReactNode }) {
    const period = useStudyPeriod();
    return <main className="auth-page">
        <div className="auth-layout">
            <aside className="auth-art" aria-label="StudyStreak study space">
                <StudyBrand variant="signature" />
                <StudyScene period={period} />
                <p className="auth-scene-caption">{period ? descriptions[period] : 'Your space to build a study rhythm.'}</p>
            </aside>
            <section className="auth-content" aria-labelledby="auth-heading">
                <header><h1 id="auth-heading">{title}</h1><p>{description}</p></header>
                {children}
                <p className="auth-footer">{footer}</p>
            </section>
        </div>
    </main>;
}
