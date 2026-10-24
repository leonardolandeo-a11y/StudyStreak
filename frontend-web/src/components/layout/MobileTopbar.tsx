import {
    BadgeCheck,
    Bell,
    LayoutDashboard,
    Link2,
    LogOut,
    Menu,
    Target,
    X
} from "lucide-react";

import {
    NavLink,
    useNavigate
} from "react-router-dom";

import {
    useState
} from "react";

import {
    useAuth
} from "../../hooks/useAuth";

import {
    ROUTES
} from "../../routes/paths";
import {
    useUnreadNotifications
} from "../../hooks/useUnreadNotifications";

function MobileTopbar() {

    const [open, setOpen] = useState(false);
    const {unreadCount} = useUnreadNotifications();
    const {
        currentUser,
        logout
    } = useAuth();

    const navigate = useNavigate();


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
            icon: Bell,
            showBadge: true
        }
    ];


    function handleLogout() {
        logout();
        navigate(ROUTES.login);
    }


    return (
        <>
            <header
                className="
                    sticky top-0 z-40
                    flex h-16
                    items-center justify-between
                    border-b border-slate-800
                    bg-slate-950/95
                    px-4
                    backdrop-blur
                    lg:hidden
                "
            >
                <div className="flex items-center gap-3">

                    <div
                        className="
                            flex h-9 w-9
                            items-center justify-center
                            rounded-lg
                            bg-sky-500
                            font-bold
                            text-slate-950
                        "
                    >
                        S
                    </div>

                    <span className="font-semibold text-slate-100">
                        StudyStreak
                    </span>

                </div>


                <button
                    type="button"
                    onClick={() =>
                        setOpen((current) => !current)
                    }
                    aria-label="Toggle navigation"
                    aria-expanded={open}
                    className="
                        rounded-lg
                        border border-slate-700
                        bg-slate-900
                        p-2
                        text-slate-300
                        hover:bg-slate-800
                    "
                >
                    {open
                        ? <X size={20} />
                        : <Menu size={20} />}
                </button>
            </header>


            {open && (
                <div
                    className="
                        fixed inset-0 z-30
                        bg-black/50
                        lg:hidden
                    "
                    onClick={() =>
                        setOpen(false)
                    }
                >
                    <aside
                        className="
                            absolute
                            right-0 top-16
                            flex
                            h-[calc(100vh-4rem)]
                            w-72
                            flex-col
                            border-l border-slate-800
                            bg-slate-950
                            shadow-2xl
                        "
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <nav className="flex-1 space-y-1 p-4">

                            {navigation.map(
                                ({
                                    label,
                                    to,
                                    icon: Icon,
                                    showBadge
                                }) => (
                                    <NavLink
                                        key={to}
                                        to={to}
                                        onClick={() =>
                                            setOpen(false)
                                        }
                                        className={({ isActive }) => `
                                            flex items-center gap-3
                                            rounded-lg
                                            px-3 py-2.5
                                            text-sm font-medium
                                            ${
                                                isActive
                                                    ? "bg-slate-800 text-white"
                                                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                                            }
                                        `}
                                    >
                                        <Icon size={18} />

                                        <span className="flex-1">
                                            {label}
                                        </span>

                                        {showBadge &&
                                            unreadCount > 0 && (
                                                <span
                                                    className="
                                                        flex min-w-5
                                                        items-center justify-center
                                                        rounded-full
                                                        bg-sky-500
                                                        px-1.5 py-0.5
                                                        text-[11px]
                                                        font-bold
                                                        leading-none
                                                        text-slate-950
                                                    "
                                                >
                                                    {unreadCount > 99
                                                        ? "99+"
                                                        : unreadCount}
                                                </span>
                                            )}
                                    </NavLink>
                                )
                            )}

                        </nav>


                        <div className="border-t border-slate-800 p-4">

                            {currentUser && (
                                <div className="mb-4 flex items-center gap-3 px-2">

                                    <div
                                        className="
                                            flex h-9 w-9
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

                                    <div className="min-w-0">

                                        <p className="truncate text-sm font-medium text-slate-200">
                                            {currentUser.username}
                                        </p>

                                        <p className="truncate text-xs text-slate-500">
                                            {currentUser.email}
                                        </p>

                                    </div>

                                </div>
                            )}


                            <button
                                type="button"
                                onClick={handleLogout}
                                className="
                                    flex w-full
                                    items-center gap-3
                                    rounded-lg
                                    px-3 py-2.5
                                    text-sm font-medium
                                    text-slate-400
                                    hover:bg-red-950/30
                                    hover:text-red-300
                                "
                            >
                                <LogOut size={18} />

                                Sign out
                            </button>

                        </div>

                    </aside>
                </div>
            )}
        </>
    );
}


export default MobileTopbar;