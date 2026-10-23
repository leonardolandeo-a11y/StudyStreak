import { useState, type SubmitEvent } from "react";
import {
    Link,
    useNavigate
} from "react-router-dom";
import { register } from "../services/authService";

import {
    ROUTES
} from "../routes/paths";

function Register(){
    const [username, setUsername ] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string|null>(null);

    const navigate = useNavigate();

    function validateForm(): string | null {

        const trimmedUsername = username.trim();

        const trimmedEmail =email.trim();


        if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
            return "Username must contain between 3 and 30 characters.";
        }


        if (trimmedEmail.length === 0 ||trimmedEmail.length > 100) {
            return "Email must be valid and cannot exceed 100 characters.";
        }


        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(trimmedEmail)) {
            return "Email must be valid.";
        }


        if (password.length < 8 || password.length > 72) {
            return "Password must contain between 8 and 72 characters.";
        }


        const hasUppercase = /[A-Z]/.test(password);

        const hasLowercase = /[a-z]/.test(password);

        const hasNumber = /\d/.test(password);


        if ( !hasUppercase || !hasLowercase ||  !hasNumber) {
            return "Password must contain uppercase, lowercase and number.";
        }


        return null;
    }

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {

        event.preventDefault();

        const validationError = validateForm();

        if (validationError) {
            setError(validationError);
            return;
        }


        setLoading(true);
        setError(null);


        try {

            const timeZone =Intl.DateTimeFormat().resolvedOptions().timeZone;


            await register({username: username.trim(), email: email.trim(), password,timeZone });


            navigate( ROUTES.login );

        } catch {

            setError("Registration failed.");

        } finally {
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
                        Create your account
                    </h1>

                    <p className="mt-2 text-sm text-slate-400">
                        Start organizing your goals and tracking your progress.
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
                                minLength={3}
                                maxLength={30}
                                onChange={(event) =>
                                    setUsername(
                                        event.target.value
                                    )
                                }
                                placeholder="Choose a username"
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

                            <p className="mt-2 text-xs text-slate-500">
                                Between 3 and 30 characters.
                            </p>
                        </div>


                        <div>
                            <label
                                htmlFor="email"
                                className="
                                    mb-2 block
                                    text-sm font-medium
                                    text-slate-300
                                "
                            >
                                Email
                            </label>

                            <input
                                id="email"
                                type="email"
                                value={email}
                                maxLength={100}
                                onChange={(event) =>
                                    setEmail(
                                        event.target.value
                                    )
                                }
                                placeholder="you@example.com"
                                autoComplete="email"
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
                                minLength={8}
                                maxLength={72}
                                onChange={(event) =>
                                    setPassword(
                                        event.target.value
                                    )
                                }
                                placeholder="Create a strong password"
                                autoComplete="new-password"
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

                            <p className="mt-2 text-xs leading-5 text-slate-500">
                                Use 8–72 characters with uppercase,
                                lowercase, and at least one number.
                            </p>
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
                                ? "Creating account..."
                                : "Create account"}
                        </button>

                    </div>
                </form>


                <p className="mt-6 text-center text-sm text-slate-400">
                    Already have an account?{" "}

                    <Link
                        to={ROUTES.login}
                        className="
                            font-medium
                            text-sky-400
                            hover:text-sky-300
                        "
                    >
                        Sign in
                    </Link>
                </p>

            </div>
        </div>
    </div>
    )
}
export default Register;