import { NotificationPopups } from '../notifications/NotificationPopups';
import { useCallback, useId, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Users } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { SocialProvider } from "../../contexts/SocialProvider";
import { ProfileProvider } from "../../contexts/ProfileProvider";
import AppSidebar from "../layout/AppSidebar";
import MobileTopbar from "../layout/MobileTopbar";
import BackButton from "./BackButton";
import Breadcrumbs from "./Breadcrumbs";
import { ROUTES } from "../../routes/paths";
import "../academic/retro-workspace.css";
import "../workflows/workflows.css";
import { StudyPartnersPanel } from "../social/StudyPartnersPanel";

function WorkspaceLayout({ userId }: { userId: number }) {
    const location = useLocation();
    const retro = location.pathname === ROUTES.dashboard || location.pathname === ROUTES.trackingLinks || location.pathname.startsWith(ROUTES.goals) || location.pathname === ROUTES.validations;
    const immersive = location.pathname === ROUTES.dashboard || location.pathname === ROUTES.focusStudio;
    const [open, setOpen] = useState(false), [rendered, setRendered] = useState(false), [generation, setGeneration] = useState(0);
    const trigger = useRef<HTMLButtonElement>(null);
    const panelId = useId();
    const close = useCallback(() => setOpen(false), []);
    const exited = useCallback(() => setRendered(false), []);
    function toggle(event: React.MouseEvent<HTMLButtonElement>) {
        trigger.current = event.currentTarget;
        if (open) close();
        else { setGeneration(value => value + 1); setRendered(true); setOpen(true); }
    }
    const button = <button type="button" data-partners-toggle aria-label="Study partners" title="Study partners" aria-controls={panelId} aria-expanded={open}
        className="study-button size-11 shrink-0 p-0" onClick={toggle}><Users size={19} aria-hidden="true" /></button>;
    return <div className={`min-h-screen bg-canvas text-content ${retro ? "retro-shell" : ""}`}><div className="flex min-h-screen">
        <AppSidebar />
        <div className="min-w-0 flex-1">
            <MobileTopbar actions={button} />
            <header className={`border-b border-outline bg-surface/95 backdrop-blur ${immersive ? "hidden lg:block" : ""}`}>
                <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
                    {immersive ? <p className="study-kicker">Your workspace</p> : <><BackButton /><div className="min-w-0 flex-1"><Breadcrumbs /></div></>}
                    <div className="ml-auto hidden lg:block">{button}</div>
                </div>
            </header>
            <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><Outlet /></main>
        </div>
        <NotificationPopups/>
        <StudyPartnersPanel id={panelId} userId={userId} open={open} rendered={rendered} generation={generation} trigger={trigger} onClose={close} onExited={exited} />
    </div></div>;
}
export default function AuthenticatedLayout() {
    const { currentUser } = useAuth();
    return <SocialProvider><ProfileProvider>{currentUser && <WorkspaceLayout key={currentUser.id} userId={currentUser.id} />}</ProfileProvider></SocialProvider>;
}
