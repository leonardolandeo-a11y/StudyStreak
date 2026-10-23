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
    <div className="border p-4">
        <h2 className="text-xl font-bold">
            {goal.topic}
        </h2>

        <p>
            Frequency: {goal.frequency}
        </p>

        <p>
            Duration: {goal.duration}
        </p>

        <p>
            Completed:{" "}
            {goal.completed ? "Yes" : "No"}
        </p>

        <Link
            to={goalDetailsPath(goal.id)}
            className="inline-block mt-3 underline"
        >
            View details
        </Link>
    </div>
    )
}
export default GoalCard;