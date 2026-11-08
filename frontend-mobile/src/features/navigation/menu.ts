export const menuTabs = [
  { name: 'goals/index', label: 'Goals', symbol: '◎', action: 'Create a goal' },
  { name: 'tracking/index', label: 'Tracking', symbol: '↔', action: 'Send a tracking request' },
  { name: 'validations/index', label: 'Validations', symbol: '✓', action: 'Start a validation' },
  { name: 'study-rooms', label: 'Study Rooms', symbol: '♧', action: 'Create a study room' },
] as const;
export const drawerItems = [
  { label: 'Menu', route: '/goals', name: '(menu)' },
  { label: 'Dashboard', route: '/dashboard', name: 'dashboard' },
  { label: 'Focus Studio', route: '/focus-studio', name: 'focus-studio' },
  { label: 'Resources', route: '/resources', name: 'resources/index' },
  { label: 'Notifications', route: '/notifications', name: 'notifications/index' },
] as const;
