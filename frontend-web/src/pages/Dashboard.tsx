import {
    ArrowRight,
    BadgeCheck,
    BookOpen,
    Flame,
    Target
} from "lucide-react";

import { Link } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

import {
    ROUTES
} from "../routes/paths";


function Dashboard() {

    const { currentUser } = useAuth();


    if (!currentUser) {
        return null;
    }


    return (
        <div className="space-y-8">

            {/* Header */}

            <section
                className="
                    flex flex-col
                    justify-between
                    gap-4
                    sm:flex-row
                    sm:items-end
                "
            >
                <div>
                    <p className="text-sm font-medium text-sky-400">
                        Overview
                    </p>

                    <h1
                        className="
                            mt-2
                            text-3xl font-bold
                            tracking-tight
                            text-slate-100
                            sm:text-4xl
                        "
                    >
                        Welcome back, {currentUser.username}
                    </h1>

                    <p className="mt-2 text-slate-400">
                        Keep your study goals moving forward.
                    </p>
                </div>


                <Link
                    to={ROUTES.goals}
                    className="
                        inline-flex
                        w-fit
                        items-center
                        gap-2
                        rounded-lg
                        bg-sky-500
                        px-4 py-2.5
                        text-sm font-semibold
                        text-slate-950
                        hover:bg-sky-400
                    "
                >
                    View Goals

                    <ArrowRight size={16} />
                </Link>
            </section>


            {/* Main dashboard cards */}

            <section
                className="
                    grid gap-4
                    sm:grid-cols-2
                    xl:grid-cols-4
                "
            >

                <div
                    className="
                        rounded-2xl
                        border border-slate-800
                        bg-slate-900/70
                        p-5
                    "
                >
                    <div
                        className="
                            flex h-10 w-10
                            items-center justify-center
                            rounded-xl
                            bg-sky-950
                            text-sky-400
                        "
                    >
                        <Target size={20} />
                    </div>

                    <p className="mt-4 text-sm text-slate-500">
                        Goals
                    </p>

                    <p className="mt-1 font-semibold text-slate-100">
                        Plan your objectives
                    </p>
                </div>


                <div
                    className="
                        rounded-2xl
                        border border-slate-800
                        bg-slate-900/70
                        p-5
                    "
                >
                    <div
                        className="
                            flex h-10 w-10
                            items-center justify-center
                            rounded-xl
                            bg-orange-950
                            text-orange-400
                        "
                    >
                        <Flame size={20} />
                    </div>

                    <p className="mt-4 text-sm text-slate-500">
                        Streaks
                    </p>

                    <p className="mt-1 font-semibold text-slate-100">
                        Build consistency
                    </p>
                </div>


                <div
                    className="
                        rounded-2xl
                        border border-slate-800
                        bg-slate-900/70
                        p-5
                    "
                >
                    <div
                        className="
                            flex h-10 w-10
                            items-center justify-center
                            rounded-xl
                            bg-emerald-950
                            text-emerald-400
                        "
                    >
                        <BadgeCheck size={20} />
                    </div>

                    <p className="mt-4 text-sm text-slate-500">
                        Validations
                    </p>

                    <p className="mt-1 font-semibold text-slate-100">
                        Verify progress
                    </p>
                </div>


                <div
                    className="
                        rounded-2xl
                        border border-slate-800
                        bg-slate-900/70
                        p-5
                    "
                >
                    <div
                        className="
                            flex h-10 w-10
                            items-center justify-center
                            rounded-xl
                            bg-violet-950
                            text-violet-400
                        "
                    >
                        <BookOpen size={20} />
                    </div>

                    <p className="mt-4 text-sm text-slate-500">
                        Records
                    </p>

                    <p className="mt-1 font-semibold text-slate-100">
                        Log daily progress
                    </p>
                </div>

            </section>


            <section
                className="
                    grid gap-6
                    lg:grid-cols-[1.4fr_0.6fr]
                "
            >

                {/* Study workflow */}

                <div
                    className="
                        rounded-2xl
                        border border-slate-800
                        bg-slate-900/70
                        p-6
                    "
                >
                    <div>
                        <h2 className="text-xl font-semibold text-slate-100">
                            Your Study Flow
                        </h2>

                        <p className="mt-1 text-sm text-slate-400">
                            StudyStreak keeps your progress organized
                            in four simple stages.
                        </p>
                    </div>


                    <div className="mt-6 space-y-1">

                        <div
                            className="
                                flex items-start gap-4
                                rounded-xl
                                p-4
                                hover:bg-slate-800/60
                            "
                        >
                            <div
                                className="
                                    flex h-8 w-8
                                    shrink-0
                                    items-center justify-center
                                    rounded-full
                                    bg-sky-500
                                    text-sm font-bold
                                    text-slate-950
                                "
                            >
                                1
                            </div>

                            <div>
                                <p className="font-medium text-slate-100">
                                    Create a goal
                                </p>

                                <p className="mt-1 text-sm text-slate-400">
                                    Define what you want to accomplish.
                                </p>
                            </div>
                        </div>


                        <div
                            className="
                                flex items-start gap-4
                                rounded-xl
                                p-4
                                hover:bg-slate-800/60
                            "
                        >
                            <div
                                className="
                                    flex h-8 w-8
                                    shrink-0
                                    items-center justify-center
                                    rounded-full
                                    bg-slate-800
                                    text-sm font-bold
                                    text-slate-300
                                "
                            >
                                2
                            </div>

                            <div>
                                <p className="font-medium text-slate-100">
                                    Log daily progress
                                </p>

                                <p className="mt-1 text-sm text-slate-400">
                                    Keep a record of what you studied.
                                </p>
                            </div>
                        </div>


                        <div
                            className="
                                flex items-start gap-4
                                rounded-xl
                                p-4
                                hover:bg-slate-800/60
                            "
                        >
                            <div
                                className="
                                    flex h-8 w-8
                                    shrink-0
                                    items-center justify-center
                                    rounded-full
                                    bg-slate-800
                                    text-sm font-bold
                                    text-slate-300
                                "
                            >
                                3
                            </div>

                            <div>
                                <p className="font-medium text-slate-100">
                                    Build your streak
                                </p>

                                <p className="mt-1 text-sm text-slate-400">
                                    Maintain consistency over time.
                                </p>
                            </div>
                        </div>


                        <div
                            className="
                                flex items-start gap-4
                                rounded-xl
                                p-4
                                hover:bg-slate-800/60
                            "
                        >
                            <div
                                className="
                                    flex h-8 w-8
                                    shrink-0
                                    items-center justify-center
                                    rounded-full
                                    bg-slate-800
                                    text-sm font-bold
                                    text-slate-300
                                "
                            >
                                4
                            </div>

                            <div>
                                <p className="font-medium text-slate-100">
                                    Validate progress
                                </p>

                                <p className="mt-1 text-sm text-slate-400">
                                    Use tracking partners for accountability.
                                </p>
                            </div>
                        </div>

                    </div>
                </div>


                {/* Account card */}

                <aside
                    className="
                        h-fit
                        rounded-2xl
                        border border-slate-800
                        bg-slate-900/70
                        p-6
                    "
                >
                    <h2 className="text-lg font-semibold text-slate-100">
                        Account
                    </h2>


                    <div className="mt-5 flex items-center gap-3">

                        <div
                            className="
                                flex h-11 w-11
                                items-center justify-center
                                rounded-full
                                bg-sky-950
                                font-semibold
                                text-sky-300
                            "
                        >
                            {currentUser.username
                                .charAt(0)
                                .toUpperCase()}
                        </div>

                        <div className="min-w-0">
                            <p className="truncate font-medium text-slate-100">
                                {currentUser.username}
                            </p>

                            <p className="truncate text-sm text-slate-500">
                                {currentUser.email}
                            </p>
                        </div>

                    </div>


                    <div
                        className="
                            mt-5
                            border-t border-slate-800
                            pt-5
                            text-sm
                        "
                    >
                        <div className="flex justify-between gap-4">

                            <span className="text-slate-500">
                                User ID
                            </span>

                            <span className="font-medium text-slate-300">
                                {currentUser.id}
                            </span>

                        </div>


                        <div className="mt-3 flex justify-between gap-4">

                            <span className="text-slate-500">
                                Role
                            </span>

                            <span
                                className="
                                    rounded-full
                                    bg-slate-800
                                    px-2.5 py-1
                                    text-xs font-medium
                                    text-slate-300
                                "
                            >
                                {currentUser.role}
                            </span>

                        </div>
                    </div>

                </aside>

            </section>

        </div>
    );
}


export default Dashboard;