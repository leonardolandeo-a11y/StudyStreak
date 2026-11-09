import { AuthLayout } from "../components/auth/AuthLayout";
import { useState, type SubmitEvent } from "react";
import {
    Link,
    useNavigate
} from "react-router-dom";
import { register } from "../services/authService";
import axios from "axios";
import { getApiErrorMessage } from "../utils/apiError";

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
        if (loading) return;

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

        } catch (cause) {
            const status = axios.isAxiosError(cause) ? cause.response?.status : null;
            setError(status === 409 ? "This username or email is already registered." : getApiErrorMessage(cause, "Registration failed. Please try again."));
        } finally {
            setLoading(false);
        }
    }

    return <AuthLayout title="Create your account" description="Start organizing your goals and tracking your progress."
        footer={<>Already have an account? <Link to={ROUTES.login}>Sign in</Link></>}>
        <form onSubmit={handleSubmit} aria-busy={loading} className="auth-form">
            <div className="auth-field"><label htmlFor="username">Username</label>
                <input id="username" type="text" value={username} minLength={3} maxLength={30}
                    onChange={event => setUsername(event.target.value)} placeholder="Choose a username" autoComplete="username" required />
                <small>Between 3 and 30 characters.</small></div>
            <div className="auth-field"><label htmlFor="email">Email</label>
                <input id="email" type="email" value={email} maxLength={100} onChange={event => setEmail(event.target.value)}
                    placeholder="you@example.com" autoComplete="email" required /></div>
            <div className="auth-field"><label htmlFor="password">Password</label>
                <input id="password" type="password" value={password} minLength={8} maxLength={72}
                    onChange={event => setPassword(event.target.value)} placeholder="Create a strong password" autoComplete="new-password" required />
                <small>Use 8–72 characters with uppercase, lowercase, and at least one number.</small></div>
            {error ? <div role="alert" className="auth-error">{error}</div> : null}
            <button type="submit" disabled={loading} className="auth-submit">{loading ? "Creating account..." : "Create account"}</button>
        </form>
    </AuthLayout>;
}
export default Register;
