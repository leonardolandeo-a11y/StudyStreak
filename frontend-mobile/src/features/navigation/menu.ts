export const menuTabs = [
  { name: 'goals/index', label: 'Goals', symbol: '◎', action: 'Create a goal' },
  { name: 'tracking/index', label: 'Tracking', symbol: '↔', action: 'Send a tracking request' },
  { name: 'validations/index', label: 'Validations', symbol: '✓', action: 'Start a validation' },
  { name: 'study-rooms', label: 'Study Rooms', symbol: '♧', action: 'Create a study room' },
] as const;

// Keep native history first; only recover a direct-linked primary destination
// with no history instead of immediately exiting the app on Android Back.
export function primaryBackTarget(canGoBack: boolean, primary: string, tab?: string): 'menu' | 'goals' | null {
  if (canGoBack) return null;
  if (primary !== '(menu)') return 'menu';
  return tab && tab !== 'goals/index' ? 'goals' : null;
}
export const drawerItems = [
  { label: 'Menu', route: '/goals', name: '(menu)' },
  { label: 'Dashboard', route: '/dashboard', name: 'dashboard' },
  { label: 'Focus Studio', route: '/focus-studio', name: 'focus-studio' },
  { label: 'Resources', route: '/resources', name: 'resources/index' },
  { label: 'Notifications', route: '/notifications', name: 'notifications/index' },
] as const;
