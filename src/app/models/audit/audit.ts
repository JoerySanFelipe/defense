import {
  QueryDocumentSnapshot,
  Timestamp,
  Transaction,
} from '@angular/fire/firestore';
import { UserType } from '../user-type';
import { ActionType, ComponentType } from './audit_type';

export interface Audit {
  id: string;
  email: string;
  role: UserType;
  action: ActionType;
  component: ComponentType;
  payload: any;
  details: string;
  timestamp: Date;
}

export const AuditLogConverter = {
  toFirestore: (data: Audit) => data,
  fromFirestore: (snap: QueryDocumentSnapshot) => {
    const data = snap.data() as Audit;

    if (data.timestamp instanceof Timestamp) {
      data.timestamp = data.timestamp.toDate();
    }

    return data;
  },
};
