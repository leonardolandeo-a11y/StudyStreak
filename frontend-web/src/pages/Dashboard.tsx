import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router-dom";

function Dashboard(){
    const {logout, currentUser} = useAuth();
    const navigate = useNavigate();

    function handleLogout(){
        logout();
        navigate("/login");
    }
    return (
    <div className="p-6">
        <h1 className="text-3xl font-bold">
            Dashboard
        </h1>

        {currentUser && (
        <div className="mt-4">
            <p>Username: {currentUser.username}</p>
            <p>User ID: {currentUser.id}</p>
            <p>Email: {currentUser.email}</p>
            <p>Role: {currentUser.role}</p>
        </div>
        )}

        <div className="mt-4">
            <Link
                to="/goals"
                className="border p-2"
            >
                View Goals
            </Link>
        </div>
        <div className="mt-4">
            <Link
                to="/tracking-links"
                className="border p-2"
            >
                Tracking Links
            </Link>
        </div>
        <div className="mt-4">
            <Link
                to="/validations"
                className="border p-2"
            >
                Validations
            </Link>
        </div>
        <div className="mt-4">
            <Link
                to="/notifications"
                className="border p-2"
            >
                Notifications
            </Link>
        </div>
        <button
        onClick={handleLogout}
        className="border p-2 mt-4"
        >
            Logout
        </button>

    </div>
    );
}
export default Dashboard;
