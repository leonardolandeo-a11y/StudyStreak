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
            className="mb-4 border p-2"
        >
            Back
        </button>
    );
}
export default BackButton;