import {
    Bell,
    BadgeCheck,
    LayoutDashboard,
    Link2,
    LogOut,
    Target
} from "lucide-react";

import {
    NavLink,
    useNavigate
} from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";
import { ROUTES } from "../../routes/paths";


function AppSidebar() {
    const { currentUser, logout } = useAuth();

    const navigate = useNavigate();


    function handleLogout() {
        logout();
        navigate(ROUTES.login);
    }


    const navigation = [
        {
            label: "Dashboard",
            to: ROUTES.dashboard,
            icon: LayoutDashboard
        },
        {
            label: "Goals",
            to: ROUTES.goals,
            icon: Target
        },
        {
            label: "Tracking",
            to: ROUTES.trackingLinks,
            icon: Link2
        },
        {
            label: "Validations",
            to: ROUTES.validations,
            icon: BadgeCheck
        },
        {
            label: "Notifications",
            to: ROUTES.notifications,
            icon: Bell
        }
    ];


    return (
    <aside
        className="
            sticky top-0
            hidden h-screen w-64
            shrink-0 flex-col
            border-r border-slate-800/80
            bg-slate-950
            lg:flex
        "
    >
        {/* Brand */}

        <div className="flex h-16 items-center px-5">

            <div
                className="
                    flex h-9 w-9
                    items-center justify-center
                    rounded-xl
                    bg-sky-500
                    font-bold
                    text-slate-950
                    shadow-lg shadow-sky-950/30
                "
            >
                S
            </div>

            <div className="ml-3">
                <p className="text-sm font-semibold text-slate-100">
                    StudyStreak
                </p>

                <p className="text-xs text-slate-500">
                    Study workspace
                </p>
            </div>

        </div>


        {/* Navigation */}

        <div className="px-3 pt-4">

            <p
                className="
                    mb-2 px-3
                    text-[11px] font-semibold
                    uppercase tracking-wider
                    text-slate-600
                "
            >
                Workspace
            </p>


            <nav className="space-y-1">

                {navigation.map(
                    ({
                        label,
                        to,
                        icon: Icon
                    }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) => `
                                group
                                flex items-center
                                gap-3
                                rounded-lg
                                px-3 py-2.5
                                text-sm font-medium
                                transition-colors
                                ${
                                    isActive
                                        ? "bg-slate-800 text-slate-100"
                                        : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                                }
                            `}
                        >
                            {({ isActive }) => (
                                <>
                                    <Icon
                                        size={18}
                                        strokeWidth={1.8}
                                        className={
                                            isActive
                                                ? "text-sky-400"
                                                : "text-slate-500 group-hover:text-slate-300"
                                        }
                                    />

                                    <span>
                                        {label}
                                    </span>
                                </>
                            )}
                        </NavLink>
                    )
                )}

            </nav>

        </div>


        <div className="flex-1" />


        {/* User */}

        <div className="border-t border-slate-800/80 p-3">

            {currentUser && (
                <div
                    className="
                        flex items-center
                        gap-3
                        rounded-xl
                        px-3 py-3
                    "
                >
                    <div
                        className="
                            flex h-9 w-9
                            shrink-0
                            items-center justify-center
                            rounded-full
                            bg-slate-800
                            text-sm font-semibold
                            text-slate-200
                        "
                    >
                        {currentUser.username
                            .charAt(0)
                            .toUpperCase()}
                    </div>


                    <div className="min-w-0 flex-1">

                        <p
                            className="
                                truncate
                                text-sm font-medium
                                text-slate-200
                            "
                        >
                            {currentUser.username}
                        </p>

                        <p
                            className="
                                truncate
                                text-xs
                                text-slate-500
                            "
                        >
                            {currentUser.email}
                        </p>

                    </div>
                </div>
            )}


            <button
                type="button"
                onClick={handleLogout}
                className="
                    mt-1
                    flex w-full
                    items-center gap-3
                    rounded-lg
                    px-3 py-2.5
                    text-sm font-medium
                    text-slate-500
                    hover:bg-red-950/30
                    hover:text-red-300
                "
            >
                <LogOut
                    size={18}
                    strokeWidth={1.8}
                />

                Sign out
            </button>

        </div>
    </aside>
    );
}


export default AppSidebar;