import {
    Outlet
} from "react-router-dom";

import Breadcrumbs from "./Breadcrumbs";
import BackButton from "./BackButton";

function AuthenticatedLayout(){
    return (
        <div>
            <div className="p-6 pb-0">
                <BackButton></BackButton>
                <Breadcrumbs />
            </div>

            <Outlet />
        </div>
    );
}
export default AuthenticatedLayout;