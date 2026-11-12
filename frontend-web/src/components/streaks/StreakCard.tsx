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
            streak-card rounded-xl
            border border-outline
            bg-surface
            p-5
            shadow-sm shadow-appearance-shadow/5
        "
    >
        <div className="flex items-center justify-between gap-4">
            <div>
                <p className="text-sm font-medium text-accent">
                    Progress
                </p>

                <h2 className="mt-1 text-xl font-semibold text-content">
                    Streak
                </h2>
            </div>

            <div
                className="
                    rounded-full
                    bg-accent-soft
                    px-3 py-1
                    text-sm font-semibold
                    text-accent
                "
            >
                {streak.currentStreak} days
            </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div
                className="
                    rounded-xl
                    border border-outline
                    bg-surface-hover
                    p-4
                "
            >
                <p className="text-xs uppercase tracking-wide text-content-muted">
                    Current
                </p>

                <p className="mt-2 text-2xl font-bold text-content">
                    {streak.currentStreak}
                </p>
            </div>

            <div
                className="
                    rounded-xl
                    border border-outline
                    bg-surface-hover
                    p-4
                "
            >
                <p className="text-xs uppercase tracking-wide text-content-muted">
                    Best
                </p>

                <p className="mt-2 text-2xl font-bold text-content">
                    {streak.bestStreak}
                </p>
            </div>

            <div
                className="
                    rounded-xl
                    border border-outline
                    bg-surface-hover
                    p-4
                "
            >
                <p className="text-xs uppercase tracking-wide text-content-muted">
                    Last updated
                </p>

                <p className="mt-2 text-sm font-medium text-content-secondary">
                    {streak.lastUpdateDate}
                </p>
            </div>
        </div>
    </section>
    );
}


export default StreakCard;