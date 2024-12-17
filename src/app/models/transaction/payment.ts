import { Timestamp } from '@angular/fire/firestore';

export interface Payment {
  amount: number;
  type: PaymentType;
  status: PaymentStatus;
  discount: number;
  details: PaymentDetails | null;
}
export enum PaymentType {
  COD,
  GCASH,
  PAY_IN_COUNTER,
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
}

export interface PaymentDetails {
  cashReceive: number;
  confirmedBy: string;
  reference: string;
  attachmentURL: string;
  createdAt: Date;
}
