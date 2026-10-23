import type { Goal } from "../../types/goal";
import { Link } from "react-router-dom";
import {
    goalDetailsPath
} from "../../routes/paths";
interface GoalCardProps{
    goal:Goal;
}
function GoalCard({goal}: GoalCardProps){
    return(
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
                <h2 className="text-xl font-semibold text-slate-100">
                    {goal.topic}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    Goal #{goal.id}
                </p>
            </div>

            <span
                className={`
                    rounded-full
                    px-3 py-1
                    text-xs font-semibold
                    ${
                        goal.completed
                            ? "bg-emerald-950/60 text-emerald-300"
                            : "bg-sky-950/60 text-sky-300"
                    }
                `}
            >
                {goal.completed ? "Completed" : "Active"}
            </span>

        </div>


        <div
            className="
                mt-5
                grid gap-3
                sm:grid-cols-2
            "
        >
            <div
                className="
                    rounded-lg
                    border border-slate-800
                    bg-slate-950/50
                    px-4 py-3
                "
            >
                <p className="text-xs uppercase tracking-wide text-slate-500">
                    Frequency
                </p>

                <p className="mt-1 font-medium text-slate-200">
                    {goal.frequency}
                </p>
            </div>

            <div
                className="
                    rounded-lg
                    border border-slate-800
                    bg-slate-950/50
                    px-4 py-3
                "
            >
                <p className="text-xs uppercase tracking-wide text-slate-500">
                    Duration
                </p>

                <p className="mt-1 font-medium text-slate-200">
                    {goal.duration}
                </p>
            </div>
        </div>


        <div className="mt-5">
            <Link
                to={goalDetailsPath(goal.id)}
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
    )
}
export default GoalCard;