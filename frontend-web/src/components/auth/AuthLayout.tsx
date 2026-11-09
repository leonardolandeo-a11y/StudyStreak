import type { ReactNode, PointerEvent } from 'react';
import { StudyBrand } from '../branding/StudyBrand';
import { StudyScene } from './StudyScene';
import { useStudyPeriod } from './useStudyPeriod';
import './auth.css';
export function AuthLayout({ title, description, children, footer }: { title: string; description: string; children: ReactNode; footer: ReactNode }) {
    const period = useStudyPeriod();
    function parallax(event: PointerEvent<HTMLElement>) {
        if (event.pointerType !== 'mouse' || event.currentTarget.querySelector('[data-ambient="running"]') === null) return;
        event.currentTarget.style.setProperty('--scene-x', `${(event.clientX / innerWidth - .5) * 4}px`);
        event.currentTarget.style.setProperty('--scene-y', `${(event.clientY / innerHeight - .5) * 2}px`);
    }
    return <main className="auth-page" onPointerMove={parallax}>
        <StudyScene period={period} />
        <section className="auth-content" aria-labelledby="auth-heading">
            <StudyBrand variant="signature" />
            <header><h1 id="auth-heading">{title}</h1><p>{description}</p></header>
            {children}
            <p className="auth-footer">{footer}</p>
        </section>
    </main>;
}
