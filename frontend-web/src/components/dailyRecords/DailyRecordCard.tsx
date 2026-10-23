import { Link } from "react-router-dom";

import type { DailyRecord } from "../../types/dailyRecord";
import {
    dailyRecordDetailsPath
} from "../../routes/paths";

interface DailyRecordCardProps{
    dailyRecord:DailyRecord;
    goalId:number;
}

function DailyRecordCard({dailyRecord, goalId}:DailyRecordCardProps){
    return (
    <article
        className="
            rounded-2xl
            border border-slate-800
            bg-slate-900/70
            p-5
            shadow-lg shadow-black/10
            transition
            hover:-translate-y-0.5
            hover:border-slate-700
            hover:bg-slate-900
        "
    >
        <div className="flex flex-wrap items-start justify-between gap-4">

            <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                    Daily Record
                </p>

                <h2 className="mt-1 text-xl font-semibold text-slate-100">
                    {dailyRecord.date}
                </h2>
            </div>

            <span
                className="
                    rounded-full
                    bg-sky-950/60
                    px-3 py-1
                    text-xs font-semibold
                    text-sky-300
                "
            >
                Record #{dailyRecord.id}
            </span>
        </div>


        <div className="mt-5 space-y-4">

            <div
                className="
                    rounded-xl
                    border border-slate-800
                    bg-slate-950/50
                    p-4
                "
            >
                <p className="text-xs uppercase tracking-wide text-slate-500">
                    Note
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-300">
                    {dailyRecord.note || "No note"}
                </p>
            </div>


            <div
                className="
                    rounded-xl
                    border border-slate-800
                    bg-slate-950/50
                    p-4
                "
            >
                <p className="text-xs uppercase tracking-wide text-slate-500">
                    Evidence
                </p>

                <p
                    className="
                        mt-2
                        break-words
                        text-sm
                        text-slate-300
                    "
                >
                    {dailyRecord.evidence || "No evidence"}
                </p>
            </div>

        </div>


        <div className="mt-5">
            <Link
                to={
                    dailyRecordDetailsPath(
                        goalId,
                        dailyRecord.id
                    )
                }
                className="
                    inline-flex items-center
                    rounded-lg
                    bg-slate-800
                    px-4 py-2
                    text-sm font-medium
                    text-slate-200
                    hover:bg-slate-700
                    hover:text-white
                "
            >
                View details
            </Link>
        </div>
    </article>
    );

}
export default DailyRecordCard;