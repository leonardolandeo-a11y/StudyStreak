import { useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
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
    <div className="min-h-screen flex items-center justify-center">
        <form
            onSubmit={handleSubmit}
            className="w-full max-w-sm space-y-4"
        >
            <h1 className="text-3xl font-bold">
                Create account
            </h1>

            <div>
                <label htmlFor="username">
                    Username
                </label>

                <input
                    id="username"
                    type="text"
                    value={username}
                    minLength={3}
                    maxLength={30}
                    onChange={(event) =>
                        setUsername(event.target.value)
                    }
                    className="w-full border p-2"
                    required
                />
            </div>

            <div>
                <label htmlFor="email">
                    Email
                </label>

                <input
                    id="email"
                    type="email"
                    value={email}
                    maxLength={100}
                    onChange={(event) =>
                        setEmail(event.target.value)
                    }
                    className="w-full border p-2"
                    required
                />
            </div>

            <div>
                <label htmlFor="password">
                    Password
                </label>

                <input
                    id="password"
                    type="password"
                    value={password}
                    minLength={8}
                    maxLength={72}
                    onChange={(event) =>
                        setPassword(event.target.value)
                    }
                    className="w-full border p-2"
                    required
                />
            </div>

            {error && (
                <p className="text-red-500">
                    {error}
                </p>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full border p-2"
            >
                {loading? "Creating account...": "Register"}
            </button>
        </form>
    </div>
    )
}
export default Register;