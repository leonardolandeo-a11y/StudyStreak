import type { Notification } from '../types/notification';

export type NotificationDestination =
  | { kind: 'reviewedRecord'; goalId: number; recordId: number }
  | { kind: 'goal'; goalId: number }
  | { kind: 'goals' }
  | { kind: 'tracking' }
  | { kind: 'home' };

export function notificationDestination(notification: Notification): NotificationDestination {
  switch (notification.type) {
    case 'VALIDATION_RECEIVED':
      if (notification.relatedGoalId && notification.relatedDailyRecordId) {
        return {
          kind: 'reviewedRecord',
          goalId: notification.relatedGoalId,
          recordId: notification.relatedDailyRecordId,
        };
      }
      return { kind: 'goals' }; // Existing notifications have no record reference.
    case 'GOAL_COMPLETED':
      return notification.relatedGoalId
        ? { kind: 'goal', goalId: notification.relatedGoalId }
        : { kind: 'goals' };
    case 'TRACKING_REQUESTED':
    case 'TRACKING_ACCEPTED':
    case 'TRACKING_REJECTED':
    case 'TRACKING_BROKEN':
      return { kind: 'tracking' };
    case 'PENDING_CHECK_IN':
      return { kind: 'goals' };
    case 'WEEKLY_SUMMARY':
      return { kind: 'home' };
  }
}

export function notificationActionLabel(notification: Notification): string {
  switch (notification.type) {
    case 'VALIDATION_RECEIVED':
      return notification.relatedDailyRecordId ? 'View reviewed record' : 'View my goals';
    case 'GOAL_COMPLETED': return 'View goal';
    case 'TRACKING_REQUESTED':
    case 'TRACKING_ACCEPTED':
    case 'TRACKING_REJECTED':
    case 'TRACKING_BROKEN': return 'View tracking links';
    case 'PENDING_CHECK_IN': return 'View my goals';
    case 'WEEKLY_SUMMARY': return 'View dashboard';
  }
}
