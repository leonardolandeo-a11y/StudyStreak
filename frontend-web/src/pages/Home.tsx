import { Link } from "react-router-dom";
import { ROUTES } from "../routes/paths";

function Home(){
    return (
       <div className="min-h-screen bg-slate-950 px-4 py-10">
            <div
                className="
                    mx-auto
                    flex min-h-[calc(100vh-5rem)]
                    max-w-6xl
                    items-center
                "
            >
                <div
                    className="
                        grid w-full
                        gap-10
                        lg:grid-cols-[1.2fr_0.8fr]
                        lg:items-center
                    "
                >
                    <section>
                        <p className="text-sm font-semibold text-sky-400">
                            StudyStreak
                        </p>

                        <h1
                            className="
                                mt-4
                                max-w-3xl
                                text-4xl font-bold
                                tracking-tight
                                text-slate-100
                                sm:text-5xl
                                lg:text-6xl
                            "
                        >
                            Build consistent study habits.
                        </h1>

                        <p
                            className="
                                mt-6
                                max-w-2xl
                                text-lg leading-8
                                text-slate-400
                            "
                        >
                            Create goals, record daily progress,
                            maintain streaks, connect with study
                            partners, and validate each other's work.
                        </p>

                        <div className="mt-8 flex flex-wrap gap-3">

                            <Link
                                to={ROUTES.register}
                                className="
                                    rounded-lg
                                    bg-sky-500
                                    px-5 py-3
                                    text-sm font-semibold
                                    text-slate-950
                                    hover:bg-sky-400
                                "
                            >
                                Create account
                            </Link>

                            <Link
                                to={ROUTES.login}
                                className="
                                    rounded-lg
                                    border border-slate-700
                                    bg-slate-900
                                    px-5 py-3
                                    text-sm font-medium
                                    text-slate-200
                                    hover:border-slate-600
                                    hover:bg-slate-800
                                "
                            >
                                Sign in
                            </Link>

                        </div>
                    </section>


                    <section
                        className="
                            rounded-3xl
                            border border-slate-800
                            bg-slate-900/70
                            p-6
                            shadow-2xl shadow-black/20
                        "
                    >
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">

                            <div
                                className="
                                    rounded-2xl
                                    border border-slate-800
                                    bg-slate-950/60
                                    p-5
                                "
                            >
                                <p className="text-sm font-medium text-sky-400">
                                    Goals
                                </p>

                                <p className="mt-2 text-sm leading-6 text-slate-400">
                                    Define what you want to study and
                                    keep your objectives organized.
                                </p>
                            </div>


                            <div
                                className="
                                    rounded-2xl
                                    border border-slate-800
                                    bg-slate-950/60
                                    p-5
                                "
                            >
                                <p className="text-sm font-medium text-emerald-400">
                                    Daily progress
                                </p>

                                <p className="mt-2 text-sm leading-6 text-slate-400">
                                    Record what you accomplish each day
                                    and build consistent streaks.
                                </p>
                            </div>


                            <div
                                className="
                                    rounded-2xl
                                    border border-slate-800
                                    bg-slate-950/60
                                    p-5
                                "
                            >
                                <p className="text-sm font-medium text-amber-400">
                                    Accountability
                                </p>

                                <p className="mt-2 text-sm leading-6 text-slate-400">
                                    Connect with other users and validate
                                    progress through tracking partnerships.
                                </p>
                            </div>

                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
export default Home;
