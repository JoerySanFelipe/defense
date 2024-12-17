export interface Notifications {
  id: string;
  userID: string;
  variantID: string;
  type: NotificationType;
  message: string;
  createdAt: Date;
}

export enum NotificationType {
  ADDED = 'added',
  DEDUCTED = 'deducted',
  MODIFY = 'modify',
}
