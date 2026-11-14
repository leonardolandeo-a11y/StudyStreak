import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, useNavigate } from "react-router-dom";
import { Bell, BadgeCheck, Headphones, LayoutDashboard, Link2, LogOut, PanelLeftClose, PanelLeftOpen, Target, Users } from "lucide-react";
import { SidebarSkyline } from "./SidebarSkyline";
import { StudyBrand, StudyMark } from "../branding/StudyBrand";
import { PageTurnBookIcon } from "../icons/PageTurnBookIcon";
import { UserPanel } from "./UserPanel";
import { useAuth } from "../../hooks/useAuth";
import { ROUTES } from "../../routes/paths";
import { useUnreadNotifications } from "../../hooks/useUnreadNotifications";
import './sidebar.css';

const navigation = [
    { label: "Dashboard", to: ROUTES.dashboard, icon: LayoutDashboard, description: "Your verified activity and study insights." },
    { label: "Focus Studio", to: ROUTES.focusStudio, icon: Headphones, description: "Settle into a Pomodoro with your soundscapes." },
    { label: "Study Rooms", to: ROUTES.studyRooms, icon: Users, description: "Share a study clock with your partners." },
    { label: "Goals", to: ROUTES.goals, icon: Target, description: "Plan your goals and keep a daily study record." },
    { label: "Resources", to: ROUTES.resources, icon: PageTurnBookIcon, description: "Find books to support your study goals." },
    { label: "Tracking", to: ROUTES.trackingLinks, icon: Link2, description: "Manage invitations and study connections." },
    { label: "Validations", to: ROUTES.validations, icon: BadgeCheck, description: "Review your partners’ study evidence." },
    { label: "Notifications", to: ROUTES.notifications, icon: Bell, description: "Catch up on requests and study updates." }
];

function SidebarDestination({ item, collapsed, count }: { item: typeof navigation[number]; collapsed: boolean; count: number }) {
    const id = useId();
    const link = useRef<HTMLAnchorElement>(null);
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [tooltip, setTooltip] = useState<{ top: number; left: number } | null>(null);
    useEffect(() => {
        const dismiss = () => setTooltip(null);
        window.addEventListener("scroll", dismiss, true);
        window.addEventListener("resize", dismiss);
        return () => {
            if (hideTimer.current) clearTimeout(hideTimer.current);
            window.removeEventListener("scroll", dismiss, true);
            window.removeEventListener("resize", dismiss);
        };
    }, []);
    function show() {
        if (hideTimer.current) clearTimeout(hideTimer.current);
        const rect = link.current?.getBoundingClientRect();
        if (rect) setTooltip({ top: Math.max(8, Math.min(rect.top, window.innerHeight - 100)), left: rect.right + 10 });
    }
    function hide() {
        if (hideTimer.current) clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setTooltip(null), 100);
    }
    const Icon = item.icon;
    return <>
        <NavLink ref={link} to={item.to} data-nav-icon={item.label} aria-label={count > 0 ? `${item.label}, ${count} unread` : item.label}
            aria-describedby={tooltip ? id : undefined} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}
            onClick={() => setTooltip(null)} onKeyDown={event => { if (event.key === 'Escape') setTooltip(null); }}
            className={({ isActive }) => `group sidebar-nav-link sidebar-destination ${isActive ? 'bg-accent-soft text-accent' : 'text-content-secondary hover:bg-surface-hover hover:text-content'}`}>
            <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
            {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
            {count > 0 && <span className="sidebar-unread" aria-label={`${count} unread`}>{count > 99 ? "99+" : count}</span>}
        </NavLink>
        {tooltip && createPortal(<div id={id} role="tooltip" className="sidebar-description" style={tooltip}
            onMouseEnter={show} onMouseLeave={hide}>
            <strong aria-hidden="true">{item.label}</strong><span>{item.description}</span>
        </div>, document.body)}
    </>;
}

export default function AppSidebar() {
    const { currentUser, logout } = useAuth();
    const { unreadCount } = useUnreadNotifications();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    return <aside aria-label="Workspace sidebar" data-collapsed={collapsed} className="workspace-sidebar sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-outline bg-canvas lg:flex">
        <div className="sidebar-brand">{collapsed ? <StudyMark size={36}/> : <StudyBrand/>}</div>
        <button type="button" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed} aria-controls="workspace-navigation"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="sidebar-collapse study-button" onClick={() => setCollapsed(value => !value)}>
            {collapsed ? <PanelLeftOpen size={21} aria-hidden="true"/> : <><PanelLeftClose size={21} aria-hidden="true"/><span>Collapse sidebar</span></>}
        </button>
        <nav id="workspace-navigation" aria-label="Workspace" className="sidebar-destinations">
            {navigation.map(item => <SidebarDestination key={`${item.to}-${collapsed}`} item={item} collapsed={collapsed} count={item.to === ROUTES.notifications ? unreadCount : 0}/>)}
        </nav>
        <div className="sidebar-landscape" aria-hidden="true"><SidebarSkyline/></div>
        <div className="sidebar-account border-t border-outline">
            {currentUser && <UserPanel user={currentUser} compact={collapsed}/>}
            <button type="button" onClick={() => { logout(); navigate(ROUTES.login); }} aria-label="Sign out" title={collapsed ? 'Sign out' : undefined}
                className="sidebar-signout flex min-h-12 w-full items-center gap-3 rounded-control px-3 text-sm text-content-muted hover:bg-danger-surface hover:text-danger">
                <LogOut size={22} strokeWidth={1.8} aria-hidden="true"/>{!collapsed && <span>Sign out</span>}
            </button>
        </div>
    </aside>;
}
