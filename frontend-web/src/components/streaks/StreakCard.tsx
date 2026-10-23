import type {
    Streak
} from "../../types/streak";


interface StreakCardProps {
    streak: Streak;
}


function StreakCard({streak}: StreakCardProps) {

    return (
        <div className="border p-4 space-y-2">

            <h2 className="text-xl font-bold">
                Streak
            </h2>

            <p>
                Current Streak:{" "}
                {streak.currentStreak}
            </p>

            <p>
                Best Streak:{" "}
                {streak.bestStreak}
            </p>

            <p>
                Last Updated:{" "}
                {streak.lastUpdateDate}
            </p>

        </div>
    );
}


export default StreakCard;