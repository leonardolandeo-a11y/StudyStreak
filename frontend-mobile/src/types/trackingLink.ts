export type TrackingStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface TrackingLink {
  id: number;
  requesterId: number;
  receiverId: number;
  requesterUsername: string;
  receiverUsername: string;
  status: TrackingStatus;
}

export type TrackingDecision = 'ACCEPTED' | 'REJECTED';
