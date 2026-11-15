import type { Notification } from '../../types/notification';
/** Server snapshots only. Initial history is silent; timestamp + ID form a watermark. */
export function createNotificationCursor() {
    let ready=false, latestTime='', latestId=0;
    return {
        observe(rows: Notification[]) {
            const valid=rows.filter(row=>Number.isSafeInteger(row.id)&&typeof row.createdAt==='string'&&/^\d{4}-\d\d-\d\dT/.test(row.createdAt));
            const fresh=ready?valid.filter(row=>!row.read&&(row.createdAt>latestTime||(row.createdAt===latestTime&&row.id>latestId))):[];
            for(const row of valid){if(row.createdAt>latestTime){latestTime=row.createdAt;latestId=row.id;}else if(row.createdAt===latestTime)latestId=Math.max(latestId,row.id);}
            ready=true;
            return [...new Map(fresh.map(row=>[row.id,row])).values()].sort((a,b)=>a.createdAt.localeCompare(b.createdAt)||a.id-b.id);
        },
    };
}
