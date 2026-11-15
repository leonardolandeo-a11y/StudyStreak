import { AuthLayout } from "../components/auth/AuthLayout";
import { useState,type SubmitEvent } from "react";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";
import { getApiErrorMessage } from "../utils/apiError";
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
        if (loading) return;
        if (!username.trim() || !password) { setError("Enter your username and password."); return; }
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await login(username.trim(), password);
            setSuccess(true);
            navigate(ROUTES.dashboard);
        }catch (cause){
            const status = axios.isAxiosError(cause) ? cause.response?.status : null;
            setError(status === 400 || status === 401 || status === 403 ? "Invalid username or password." : getApiErrorMessage(cause, "Could not sign in. Please try again."));
        }finally{
            setLoading(false);
        }
    }

    return <AuthLayout title="Welcome back" description="Sign in to continue tracking your study progress."
        footer={<>Don't have an account? <Link to={ROUTES.register}>Create one</Link></>}>
        <form onSubmit={handleSubmit} aria-busy={loading} className="auth-form">
            <div className="auth-field"><label htmlFor="username">Username</label>
                <input id="username" type="text" value={username} onChange={event => setUsername(event.target.value)}
                    placeholder="Enter your username" autoComplete="username" required /></div>
            <div className="auth-field"><label htmlFor="password">Password</label>
                <input id="password" type="password" value={password} onChange={event => setPassword(event.target.value)}
                    placeholder="Enter your password" autoComplete="current-password" required /></div>
            {error ? <div role="alert" className="auth-error">{error}</div> : null}
            {success ? <div role="status" className="auth-success">Login successful.</div> : null}
            <button type="submit" disabled={loading} className="auth-submit">{loading ? "Logging in..." : "Login"}</button>
        </form>
    </AuthLayout>;
}
export default Login;
