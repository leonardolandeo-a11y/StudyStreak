export type NotificationType =
  | 'PENDING_CHECK_IN'
  | 'VALIDATION_RECEIVED'
  | 'WEEKLY_SUMMARY'
  | 'GOAL_COMPLETED'
  | 'TRACKING_REQUESTED'
  | 'TRACKING_ACCEPTED'
  | 'TRACKING_REJECTED'
  | 'TRACKING_BROKEN';

export interface Notification {
  id: number;
  message: string;
  read: boolean;
  createdAt: string;
  type: NotificationType;
}

export const notificationTypeLabels: Record<NotificationType, string> = {
  PENDING_CHECK_IN: 'Pending check-in',
  VALIDATION_RECEIVED: 'Validation received',
  WEEKLY_SUMMARY: 'Weekly summary',
  GOAL_COMPLETED: 'Goal completed',
  TRACKING_REQUESTED: 'Tracking requested',
  TRACKING_ACCEPTED: 'Tracking accepted',
  TRACKING_REJECTED: 'Tracking rejected',
  TRACKING_BROKEN: 'Tracking ended',
};

export const notificationTypes = Object.keys(notificationTypeLabels) as NotificationType[];
