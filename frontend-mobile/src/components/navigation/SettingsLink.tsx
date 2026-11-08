import { router, useSegments } from 'expo-router';
import { ActionButton } from '../ui/ActionButton';

export function SettingsLink() {
  const segments = useSegments();
  const selected = segments[segments.length - 1] === 'settings';
  return <ActionButton title="Settings" secondary selected={selected} disabled={selected}
    onPress={() => router.navigate('/(app)/settings')} />;
}
