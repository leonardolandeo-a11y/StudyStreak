import FocusStudio from "../components/dashboard/FocusStudio";
import { useAuth } from "../hooks/useAuth";

function FocusStudioPage() {
    const { currentUser } = useAuth();
    if (!currentUser) return null;
    return <FocusStudio key={currentUser.id} userId={currentUser.id} />;
}

export default FocusStudioPage;
