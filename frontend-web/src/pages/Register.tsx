import { useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../services/authService";

function Register(){
    const [username, setUsername ] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string|null>(null);

    const navigate = useNavigate();

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>){
        event.preventDefault();

        setLoading(true);
        setError(null);

        try{
            const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

            await register({
                username,
                email,
                password,
                timeZone
            })
            navigate("/login");
        } catch{
            setError("Registration failed.");
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
                    onChange={(event) =>setUsername(event.target.value)}
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
                    onChange={(event) =>setEmail(event.target.value)}
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