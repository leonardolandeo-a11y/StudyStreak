import {
    useLocation,
    useNavigate
} from "react-router-dom";
import {
    ROUTES
} from "../../routes/paths";
function BackButton({ fallback = ROUTES.dashboard }: { fallback?: string }){

    const navigate = useNavigate();
    const location = useLocation();

    function handleBack(){
        if (location.key === "default"){
            navigate(fallback);
            return;
        }
        navigate(-1);
    }
    return (
        <button
            type="button"
            onClick={handleBack}
            className="
                w-fit
                rounded-lg
                border border-outline-strong
                bg-surface
                px-3 py-2
                text-sm font-medium
                text-content-secondary
                hover:border-outline-strong
                hover:bg-surface-hover
            "
        >
            Back
        </button>
    );
}
export default BackButton;