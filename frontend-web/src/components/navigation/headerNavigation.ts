import { ROUTES, goalDetailsPath, dailyRecordsPath } from '../../routes/paths';
export interface HeaderCrumb { label: string; to?: string }
/** Presentation only: actual routes, guards and history remain in the existing Web router. */
export function headerNavigation(pathname: string): { detail: boolean; fallback: string; crumbs: HeaderCrumb[] } {
    const path=pathname.replace(/\/+$/,'')||'/';
    const roots: Record<string,string>={
        [ROUTES.dashboard]:'Dashboard',[ROUTES.focusStudio]:'Focus Studio',[ROUTES.goals]:'Goals',
        [ROUTES.trackingLinks]:'Tracking Links',[ROUTES.validations]:'Validations',[ROUTES.studyRooms]:'Study Rooms',
        [ROUTES.resources]:'Resources',[ROUTES.notifications]:'Notifications',[ROUTES.profile]:'Profile',[ROUTES.settings]:'Settings',
    };
    if(roots[path])return{detail:false,fallback:ROUTES.dashboard,crumbs:[{label:roots[path]}]};
    if(/^\/users\/\d+\/profile$/.test(path))return{detail:true,fallback:ROUTES.trackingLinks,crumbs:[{label:'Member Profile'}]};
    const match=path.match(/^\/goals\/(\d+)(?:\/(daily-records|tags)(?:\/(\d+))?)?$/);
    if(match){
        const goalId=Number(match[1]),section=match[2],record=match[3];
        const crumbs:HeaderCrumb[]=[{label:'Goals',to:ROUTES.goals}];
        if(!section)crumbs.push({label:'Goal details'});
        else{
            crumbs.push({label:'Goal details',to:goalDetailsPath(goalId)});
            if(section==='tags')crumbs.push({label:'Tags'});
            else{crumbs.push({label:'Daily Records',to:record?dailyRecordsPath(goalId):undefined});if(record)crumbs.push({label:'Record details'});}
        }
        return{detail:true,fallback:crumbs.at(-2)?.to??ROUTES.goals,crumbs};
    }
    return{detail:false,fallback:ROUTES.dashboard,crumbs:[{label:'StudyStreak'}]};
}
