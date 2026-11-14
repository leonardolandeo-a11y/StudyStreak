import { Link, useLocation } from 'react-router-dom';
import { headerNavigation } from './headerNavigation';
function Breadcrumbs() {
    const {pathname}=useLocation();
    return <nav aria-label="Breadcrumbs" className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-content-muted">
        {headerNavigation(pathname).crumbs.map((crumb,index)=><span key={index} className="flex min-w-0 items-center gap-2">
            {index>0&&<span aria-hidden="true" className="text-content-muted">/</span>}
            {crumb.to?<Link to={crumb.to} className="font-medium text-content-secondary hover:text-accent">{crumb.label}</Link>:<span aria-current="page" className="font-medium text-content">{crumb.label}</span>}
        </span>)}
    </nav>;
}
export default Breadcrumbs;
