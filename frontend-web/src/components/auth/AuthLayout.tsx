import type { ReactNode } from 'react';
import { StudyBrand } from '../branding/StudyBrand';
import { StudyScene } from './StudyScene';
import { DevScenePreview } from './DevScenePreview';
import { useStudyPeriod } from './useStudyPeriod';
import './auth.css';
export function AuthLayout({ title, description, children, footer }: { title: string; description: string; children: ReactNode; footer: ReactNode }) {
    const period = useStudyPeriod();
    return <main className="auth-page">
        {import.meta.env.DEV ? <DevScenePreview period={period} /> : <StudyScene period={period} />}
        <section className="auth-content" aria-labelledby="auth-heading">
            {['top-left','top-right','bottom-left','bottom-right'].map(corner=><span key={corner} aria-hidden="true" className={`auth-pixel-corner ${corner}`}/>)}
            <StudyBrand variant="signature" interactive />
            <header><h1 id="auth-heading">{title}</h1><p>{description}</p></header>
            {children}
            <p className="auth-footer">{footer}</p>
        </section>
    </main>;
}
