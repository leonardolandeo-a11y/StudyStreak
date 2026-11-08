import { useProfile } from "../../hooks/useProfile";
import { ProfileAvatar } from "../profile/ProfileAvatar";
import { Settings } from "lucide-react";
import { NavLink } from "react-router-dom";
import { ROUTES } from "../../routes/paths";
import type { AuthenticatedUser } from "../../types/auth";

export function UserPanel({ user, onSettingsClick, onProfileClick }: { user: Pick<AuthenticatedUser, "username" | "email">; onSettingsClick?: () => void; onProfileClick?: () => void }) {
    const shared = useProfile();
    const name = shared?.profile?.presentationName || user.username;
    return <div role="group" aria-label="User panel" className="flex min-w-0 items-center gap-2 rounded-control px-2 py-3">
        <NavLink to={ROUTES.profile} onClick={onProfileClick} aria-label={`Open profile for ${name}`} className="sidebar-profile-link flex min-w-0 flex-1 items-center gap-2 rounded-control px-1 py-1">
            <ProfileAvatar name={name} src={shared?.avatarUrl} />
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-content" title={name}>{name}</p><p className="truncate text-xs text-content-muted" title={user.email}>{user.email}</p></div>
        </NavLink>
        <NavLink to={ROUTES.settings} onClick={onSettingsClick} aria-label="Open settings" title="Settings"
            className={({ isActive }) => `flex size-11 shrink-0 items-center justify-center rounded-control ${isActive ? "bg-accent-soft text-accent" : "text-content-secondary hover:bg-surface-hover"}`}>
            <Settings size={18} aria-hidden="true" />
        </NavLink>
    </div>;
}
