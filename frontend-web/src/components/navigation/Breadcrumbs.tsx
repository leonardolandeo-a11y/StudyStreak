import {
    Link,
    useLocation
} from "react-router-dom";
import {
    ROUTES
} from "../../routes/paths";
function Breadcrumbs(){
    const location  = useLocation();

    const segments = location.pathname.split("/").filter(Boolean);

    function getLabel(segment:string,index:number):string{
        const previousSegment = segments[index-1];

        if( previousSegment==="goals"&& !Number.isNaN(Number(segment))){
            return `Goal ${segment}`;
        }
        if (previousSegment==="daily-records" && !Number.isNaN(Number(segment))){
            return `Record ${segment}`;
        }
        switch(segment){
            case "dashboard":
                return "Dashboard";
            case "goals":
                return "Goals";
            case "daily-records":
                return "Daily Records";
            case "tracking-links":
                return "Tracking Links";
            case "validations":
                return "Validations";
            case "notifications":
                return "Notifications";
            case "tags":
                return "Tags";
            default:
                return segment;
        }
    }
    return (
        <nav className="
            flex
            flex-wrap
            items-center
            gap-2
            text-sm
            text-slate-400
        ">

            <Link
                to={ROUTES.dashboard}
                className="
                    font-medium
                    text-slate-300
                    hover:text-sky-400
                "
            >
                Dashboard
            </Link>

            {segments
                .filter(
                    (segment) =>
                        segment !== "dashboard"
                )
                .map((segment, index, filteredSegments) => {

                        const originalIndex = segments.findIndex(
                            (value, currentIndex) =>
                                value === segment &&
                                currentIndex >= index
                        );
                        const path ="/" +segments
                                .slice(0,originalIndex + 1)
                                .join("/");

                        const isLast =index === filteredSegments.length - 1;

                        return (
                            <span
                                key={path}
                                className="flex gap-2"
                            >
                                <span className="text-slate-600">/</span>

                                {isLast ? (
                                    <span className="font-medium text-slate-100">
                                        {getLabel(
                                            segment,
                                            originalIndex
                                        )}
                                    </span>
                                ) : (
                                    <Link
                                        to={path}
                                        className="
                                            font-medium
                                            text-slate-300
                                            hover:text-sky-400
                                        "
                                    >
                                        {getLabel(
                                            segment,
                                            originalIndex
                                        )}
                                    </Link>
                                )}
                            </span>
                        );
                    }
                )}

        </nav>
    );
}
export default Breadcrumbs;