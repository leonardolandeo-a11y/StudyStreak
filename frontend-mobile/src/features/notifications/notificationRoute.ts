import type { Href } from 'expo-router';
import type { Notification } from '../../types/notification';
import { notificationDestination } from '../../utils/notificationDestination';
export function notificationRoute(notification: Notification): Href {
  const target = notificationDestination(notification);
  switch (target?.kind) {
    case 'newRecord': return { pathname:'/(app)/goals/[goalId]/records/[recordId]', params:{goalId:String(target.goalId),recordId:String(target.recordId),review:'1'} };
    case 'reviewedRecord': return { pathname:'/(app)/goals/[goalId]/records/[recordId]', params:{goalId:String(target.goalId),recordId:String(target.recordId)} };
    case 'validations': return '/validations';
    case 'goal': return { pathname:'/(app)/goals/[goalId]',params:{goalId:String(target.goalId)} };
    case 'goals': return '/goals';
    case 'tracking': return '/tracking';
    case 'home': return '/(app)/home';
    default: return '/notifications';
  }
}
