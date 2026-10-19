import { Link } from "react-router-dom";

import type { DailyRecord } from "../../types/dailyRecord";

interface DailyRecordCardProps{
    dailyRecord:DailyRecord;
    goalId:number;
}

function DailyRecordCard({dailyRecord, goalId}:DailyRecordCardProps){
    return (
        <div className="border p-4">
            <h2 className="text-xl font-bold">
                {dailyRecord.date}
            </h2>

            <p>
                Note: {dailyRecord.note ?? "No note"}
            </p>

            <p>
                Evidence: {dailyRecord.evidence ?? "No evidence"}
            </p>

            <Link
                to={`/goals/${goalId}/daily-records/${dailyRecord.id}`}
                className="inline-block mt-3 underline"
            >
                View details
            </Link>
        </div>
    );

}
export default DailyRecordCard;