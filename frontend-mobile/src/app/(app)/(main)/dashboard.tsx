import { StudyEnvironment } from '../../../components/environment/StudyEnvironment';
import { workspacePalette } from '../../../components/academic/workspacePalette';
import { useAppearance } from '../../../hooks/useAppearance';
import { Screen } from '../../../components/ui/Screen';
import { useCallback, useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useFocusedResource } from '../../../hooks/useFocusedResource';
import { getMobileFocusStatistics } from '../../../features/focus/focusStatisticsService';
import { verifiedActivity, type StudyPeriod } from '../../../features/dashboard/verifiedActivity';
import { FocusInsightsMobile } from '../../../components/focus/FocusInsightsMobile';
import { DashboardActivity } from '../../../components/dashboard/DashboardActivity';
import { DashboardGoals, DashboardRecent } from '../../../components/dashboard/DashboardContext';
import { StatusMessage } from '../../../components/ui/StatusMessage';

export default function Dashboard() {
  const { currentUser } = useAuth();
  return currentUser ? <DashboardContent key={currentUser.id} userId={currentUser.id} username={currentUser.username} /> : null;
}
function DashboardContent({ userId, username }: { userId: number; username: string }) {
  const { theme } = useAppearance();
  const colors = workspacePalette(theme);
  const [days, setDays] = useState<StudyPeriod>(7);
  const load = useCallback((signal: AbortSignal) => getMobileFocusStatistics(days, signal), [days]);
  const { state, retry } = useFocusedResource(load);
  const stats = state.status === 'success' ? state.data : null;
  const period = stats ? verifiedActivity(stats, days) : null;
  return <Screen themed compact backgroundColor={colors.background} onRefresh={retry} refreshing={state.status === 'loading'}>
    <StudyEnvironment username={username} />
    <DashboardActivity days={days} onDaysChange={setDays} state={state} retry={retry} />
    <DashboardGoals userId={userId} />
    {stats ? <FocusInsightsMobile data={stats} days={days}/> : null}
    {period && stats ? <DashboardRecent from={period.daily[0].date} to={period.daily.at(-1)!.date} timeZone={stats.timeZone} />
      : <StatusMessage message={state.status === 'loading' ? 'Loading your study period…' : 'Reload study activity to view recent attempts.'} />}
  </Screen>;
}
