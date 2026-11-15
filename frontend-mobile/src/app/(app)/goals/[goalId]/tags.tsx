import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../../hooks/useAuth';
import { Screen } from '../../../../components/ui/Screen';
import { GoalTags } from '../../../../components/tags/GoalTags';
export default function TagsRoute() {
 const { goalId } = useLocalSearchParams<{ goalId: string }>(); const { currentUser } = useAuth();
 return <Screen themed>{currentUser ? <GoalTags goalId={Number(goalId)} owner={currentUser.id} initiallyExpanded/> : null}</Screen>;
}
