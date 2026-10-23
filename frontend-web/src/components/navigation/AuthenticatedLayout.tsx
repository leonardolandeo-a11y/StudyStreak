import {
    Outlet,
    useLocation
} from "react-router-dom";

import AppSidebar from "../layout/AppSidebar";

import BackButton from "./BackButton";
import Breadcrumbs from "./Breadcrumbs";

import {
    ROUTES
} from "../../routes/paths";

import MobileTopbar from "../layout/MobileTopbar";
function AuthenticatedLayout() {
    const location = useLocation();

    const isDashboard =
        location.pathname === ROUTES.dashboard;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">

            <div className="flex min-h-screen">

                <AppSidebar />

                <div className="min-w-0 flex-1">
                    
                    <MobileTopbar />

                    {!isDashboard && (
                        <header
                            className="
                                border-b border-slate-800
                                bg-slate-950/90
                                backdrop-blur
                            "
                        >
                            <div
                                className="
                                    mx-auto
                                    flex max-w-7xl
                                    flex-wrap
                                    items-center
                                    gap-4
                                    px-4 py-4
                                    sm:px-6
                                    lg:px-8
                                "
                            >
                                <BackButton />

                                <div
                                    className="
                                        hidden
                                        h-5 w-px
                                        bg-slate-800
                                        sm:block
                                    "
                                />

                                <Breadcrumbs />
                            </div>
                        </header>
                    )}

                    <main
                        className="
                            mx-auto
                            w-full
                            max-w-7xl
                            px-4 py-8
                            sm:px-6
                            lg:px-8
                        "
                    >
                        <Outlet />
                    </main>

                </div>

            </div>

        </div>
    );
}

export default AuthenticatedLayout;