import {
    useLocation,
    useNavigate
} from "react-router-dom";
import {
    ROUTES
} from "../../routes/paths";
function BackButton(){

    const navigate = useNavigate();
    const location = useLocation();

    function handleBack(){
        if (location.key === "default"){
            navigate(ROUTES.dashboard);
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
                border border-slate-700
                bg-slate-900
                px-3 py-2
                text-sm font-medium
                text-slate-200
                hover:border-slate-600
                hover:bg-slate-800
            "
        >
            Back
        </button>
    );
}
export default BackButton;