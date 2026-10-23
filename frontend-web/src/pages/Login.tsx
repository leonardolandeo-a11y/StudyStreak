import { useState,type SubmitEvent } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
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
    <div className="min-h-screen flex items-center justify-center">
        <form
            onSubmit={handleSubmit}
            className="w-full max-w-sm space-y-4"
        >
            <h1 className="text-3xl font-bold">
                Login
            </h1>

            <div>
                <label htmlFor="username">
                    Username
                </label>

                <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
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
                    onChange={(event) =>setPassword(event.target.value)}
                    className="w-full border p-2"
                    required
                />
            </div>

            {error && (
                <p className="text-red-500">
                    {error}
                </p>
            )}

            {success && (
                <p className="text-green-500">
                    Login successful.
                </p>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full border p-2"
            >
                {loading ? "Logging in..." : "Login"}
            </button>
        </form>
    </div>
    );
}
export default Login;

