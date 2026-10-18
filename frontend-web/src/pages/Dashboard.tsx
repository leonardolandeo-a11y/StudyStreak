import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function Dashboard(){
    const {logout, currentUser} = useAuth();
    const navigate = useNavigate();

    function handleLogout(){
        logout();
        navigate("/login");
    }
    return (
        <div>
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
            <button
                onClick={handleLogout}
                className="border p-2 mt-4"
            >
                Logout
            </button>
        </div>
    )
}
export default Dashboard;
