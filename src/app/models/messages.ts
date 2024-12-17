import { QueryDocumentSnapshot, Timestamp } from '@angular/fire/firestore';

export interface Messages {
  id: string;
  senderID: string;
  receiverID: string;
  role: Role;
  message: string;
  seen: boolean;
  createdAt: Timestamp;
}

export const messagesConverter = {
  toFirestore: (data: Messages) => data,
  fromFirestore: (snap: QueryDocumentSnapshot) => snap.data() as Messages,
};
export enum Role {
  STAFF = 'STAFF',
  CUSTOMER = 'CUSTOMER',
}
