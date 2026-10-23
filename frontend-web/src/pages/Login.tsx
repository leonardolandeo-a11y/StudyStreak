import { useState,type SubmitEvent } from "react";
import { useAuth } from "../hooks/useAuth";
import {
    Link,
    useNavigate
} from "react-router-dom";
import {
    ROUTES
} from "../routes/paths";
function Login(){
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string|null> (null);
    const [success, setSuccess] = useState(false);

    const {login} = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(event:SubmitEvent<HTMLFormElement>){
        event.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await login(username,password );
            setSuccess(true);
            navigate(ROUTES.dashboard);
        }catch{
            setError("Invalid username or password.");
        }finally{
            setLoading(false);
        }
    }

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
                max-w-md
                items-center
                justify-center
            "
        >
            <div className="w-full">

                <div className="mb-8 text-center">
                    <p className="text-sm font-semibold text-sky-400">
                        StudyStreak
                    </p>

                    <h1
                        className="
                            mt-2
                            text-3xl font-bold
                            tracking-tight
                            text-slate-100
                        "
                    >
                        Welcome back
                    </h1>

                    <p className="mt-2 text-sm text-slate-400">
                        Sign in to continue tracking your study progress.
                    </p>
                </div>


                <form
                    onSubmit={handleSubmit}
                    className="
                        rounded-2xl
                        border border-slate-800
                        bg-slate-900/70
                        p-6
                        shadow-xl shadow-black/20
                    "
                >
                    <div className="space-y-5">

                        <div>
                            <label
                                htmlFor="username"
                                className="
                                    mb-2 block
                                    text-sm font-medium
                                    text-slate-300
                                "
                            >
                                Username
                            </label>

                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(event) =>
                                    setUsername(
                                        event.target.value
                                    )
                                }
                                placeholder="Enter your username"
                                autoComplete="username"
                                className="
                                    w-full
                                    rounded-lg
                                    border border-slate-700
                                    bg-slate-950
                                    px-3 py-2.5
                                    text-slate-100
                                    placeholder:text-slate-600
                                    hover:border-slate-600
                                "
                                required
                            />
                        </div>


                        <div>
                            <label
                                htmlFor="password"
                                className="
                                    mb-2 block
                                    text-sm font-medium
                                    text-slate-300
                                "
                            >
                                Password
                            </label>

                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(
                                        event.target.value
                                    )
                                }
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                className="
                                    w-full
                                    rounded-lg
                                    border border-slate-700
                                    bg-slate-950
                                    px-3 py-2.5
                                    text-slate-100
                                    placeholder:text-slate-600
                                    hover:border-slate-600
                                "
                                required
                            />
                        </div>


                        {error && (
                            <div
                                role="alert"
                                className="
                                    rounded-lg
                                    border border-red-900/60
                                    bg-red-950/40
                                    px-4 py-3
                                    text-sm text-red-300
                                "
                            >
                                {error}
                            </div>
                        )}


                        {success && (
                            <div
                                className="
                                    rounded-lg
                                    border border-emerald-900/60
                                    bg-emerald-950/40
                                    px-4 py-3
                                    text-sm text-emerald-300
                                "
                            >
                                Login successful.
                            </div>
                        )}


                        <button
                            type="submit"
                            disabled={loading}
                            className="
                                w-full
                                rounded-lg
                                bg-sky-500
                                px-4 py-2.5
                                text-sm font-semibold
                                text-slate-950
                                hover:bg-sky-400
                                disabled:opacity-50
                            "
                        >
                            {loading
                                ? "Logging in..."
                                : "Login"}
                        </button>

                    </div>
                </form>


                <p className="mt-6 text-center text-sm text-slate-400">
                    Don't have an account?{" "}

                    <Link
                        to={ROUTES.register}
                        className="
                            font-medium
                            text-sky-400
                            hover:text-sky-300
                        "
                    >
                        Create one
                    </Link>
                </p>

            </div>
        </div>
    </div>
    );
}
export default Login;

