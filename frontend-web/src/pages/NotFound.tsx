import { Link } from "react-router-dom";
import { ROUTES } from "../routes/paths";
function NotFound(){
    return (
        <div
            className="
                min-h-screen
                bg-slate-950
                px-4 py-10
            "
        >
            <div
                className="
                    mx-auto
                    flex min-h-[calc(100vh-5rem)]
                    max-w-xl
                    items-center
                    justify-center
                "
            >
                <section
                    className="
                        w-full
                        rounded-3xl
                        border border-slate-800
                        bg-slate-900/70
                        p-8
                        text-center
                        shadow-xl shadow-black/20
                    "
                >
                    <p
                        className="
                            text-sm font-semibold
                            uppercase tracking-widest
                            text-sky-400
                        "
                    >
                        Error 404
                    </p>

                    <h1
                        className="
                            mt-3
                            text-4xl font-bold
                            tracking-tight
                            text-slate-100
                        "
                    >
                        Page not found
                    </h1>

                    <p
                        className="
                            mx-auto mt-4
                            max-w-md
                            text-sm leading-6
                            text-slate-400
                        "
                    >
                        The page you are looking for does not exist
                        or may have been moved.
                    </p>

                    <div
                        className="
                            mt-8
                            flex flex-wrap
                            justify-center
                            gap-3
                        "
                    >
                        <Link
                            to={ROUTES.home}
                            className="
                                rounded-lg
                                bg-sky-500
                                px-5 py-2.5
                                text-sm font-semibold
                                text-slate-950
                                hover:bg-sky-400
                            "
                        >
                            Go Home
                        </Link>

                        <Link
                            to={ROUTES.dashboard}
                            className="
                                rounded-lg
                                border border-slate-700
                                bg-slate-950
                                px-5 py-2.5
                                text-sm font-medium
                                text-slate-200
                                hover:border-slate-600
                                hover:bg-slate-800
                            "
                        >
                            Dashboard
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
export default NotFound;