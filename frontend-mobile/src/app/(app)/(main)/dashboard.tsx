import { Screen } from '../../../components/ui/Screen';
import { PageHeading } from '../../../components/ui/PageHeading';

// Delivery B replaces this route with the verified activity dashboard.
export default function Dashboard() {
  return <Screen themed><PageHeading title="Dashboard" description="Your verified study activity will appear here in the next delivery." /></Screen>;
}
