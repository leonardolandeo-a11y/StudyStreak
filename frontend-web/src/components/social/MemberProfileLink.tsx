import { Link } from "react-router-dom";
import { socialProfilePath } from "../../routes/paths";
export function MemberProfileLink({ id, name }: { id: number; name: string }) {
    return <Link to={socialProfilePath(id)} className="mt-2 inline-flex min-h-11 items-center rounded-control px-2 text-sm font-medium text-accent hover:bg-accent-soft" aria-label={`View profile of ${name}`}>View profile</Link>;
}
