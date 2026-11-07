import { Settings } from "lucide-react";
import { NavLink } from "react-router-dom";
import { ROUTES } from "../../routes/paths";
import type { AuthenticatedUser } from "../../types/auth";

export function UserPanel({ user, onSettingsClick }: { user: Pick<AuthenticatedUser, "username" | "email">; onSettingsClick?: () => void }) {
    return <div role="group" aria-label="User panel" className="flex min-w-0 items-center gap-2 rounded-control px-2 py-3">
        <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-hover text-sm font-semibold text-content-secondary">{user.username.charAt(0).toUpperCase()}</span>
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-content" title={user.username}>{user.username}</p><p className="truncate text-xs text-content-muted" title={user.email}>{user.email}</p></div>
        <NavLink to={ROUTES.settings} onClick={onSettingsClick} aria-label="Open settings" title="Settings"
            className={({ isActive }) => `flex size-11 shrink-0 items-center justify-center rounded-control ${isActive ? "bg-accent-soft text-accent" : "text-content-secondary hover:bg-surface-hover"}`}>
            <Settings size={18} aria-hidden="true" />
        </NavLink>
    </div>;
}
