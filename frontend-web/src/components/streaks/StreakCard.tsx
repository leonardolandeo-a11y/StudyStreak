import type {
    Streak
} from "../../types/streak";


interface StreakCardProps {
    streak: Streak;
}


function StreakCard({streak}: StreakCardProps) {

    return (
    <section
        className="
            rounded-2xl
            border border-slate-800
            bg-slate-900/70
            p-5
            shadow-lg shadow-black/10
        "
    >
        <div className="flex items-center justify-between gap-4">
            <div>
                <p className="text-sm font-medium text-sky-400">
                    Progress
                </p>

                <h2 className="mt-1 text-xl font-semibold text-slate-100">
                    Streak
                </h2>
            </div>

            <div
                className="
                    rounded-full
                    bg-orange-950/60
                    px-3 py-1
                    text-sm font-semibold
                    text-orange-300
                "
            >
                {streak.currentStreak} days
            </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div
                className="
                    rounded-xl
                    border border-slate-800
                    bg-slate-950/50
                    p-4
                "
            >
                <p className="text-xs uppercase tracking-wide text-slate-500">
                    Current
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-100">
                    {streak.currentStreak}
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
                    Best
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-100">
                    {streak.bestStreak}
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
                    Last updated
                </p>

                <p className="mt-2 text-sm font-medium text-slate-200">
                    {streak.lastUpdateDate}
                </p>
            </div>
        </div>
    </section>
    );
}


export default StreakCard;