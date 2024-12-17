import { Timestamp } from '@angular/fire/firestore';
import { TransactionStatus } from './transaction_status';

export interface TrasactionDetails {
  id: string;
  transactionID: string;
  updatedBy: string;
  message: string;
  status: TransactionStatus;
  seen: boolean;
  updatedAt: Timestamp;
}
