import { ROUTES, dailyRecordDetailsPath, goalDetailsPath } from '../routes/paths';
import type { Notification } from '../types/notification';

export function notificationDestination(notification: Notification): string {
  switch (notification.type) {
    case 'DAILY_RECORD_CREATED':
      if (notification.relatedGoalId && notification.relatedDailyRecordId) {
        return `${dailyRecordDetailsPath(notification.relatedGoalId, notification.relatedDailyRecordId)}?review=1`;
      }
      return ROUTES.validations;
    case 'VALIDATION_RECEIVED':
      if (notification.relatedGoalId && notification.relatedDailyRecordId) {
        return dailyRecordDetailsPath(notification.relatedGoalId, notification.relatedDailyRecordId);
      }
      return ROUTES.goals; // Older notifications have no record reference.
    case 'GOAL_COMPLETED':
      return notification.relatedGoalId ? goalDetailsPath(notification.relatedGoalId) : ROUTES.goals;
    case 'TRACKING_REQUESTED':
    case 'TRACKING_ACCEPTED':
    case 'TRACKING_REJECTED':
    case 'TRACKING_BROKEN':
      return ROUTES.trackingLinks;
    case 'PENDING_CHECK_IN':
      return ROUTES.goals;
    case 'WEEKLY_SUMMARY':
      return ROUTES.dashboard;
  }
}

export function notificationActionLabel(notification: Notification): string {
  switch (notification.type) {
    case 'DAILY_RECORD_CREATED': return notification.relatedGoalId && notification.relatedDailyRecordId ? 'Review new record' : 'View validations';
    case 'VALIDATION_RECEIVED': return notification.relatedDailyRecordId ? 'View reviewed record' : 'View my goals';
    case 'GOAL_COMPLETED': return 'View goal';
    case 'TRACKING_REQUESTED':
    case 'TRACKING_ACCEPTED':
    case 'TRACKING_REJECTED':
    case 'TRACKING_BROKEN': return 'View tracking links';
    case 'PENDING_CHECK_IN': return 'View my goals';
    case 'WEEKLY_SUMMARY': return 'View dashboard';
  }
}
