import {
  QueryDocumentSnapshot,
  Timestamp,
  Transaction,
} from '@angular/fire/firestore';
import { OrderItems } from './order_items';
import { Payment } from './payment';
import { ShippingFee } from './shipping_fee';
import { TrasactionDetails } from './transaction_details';
import { TransactionSchedule } from './transaction_schedule';
import { TransactionStatus } from './transaction_status';
import { TransactionType } from './transaction_type';
import { Address } from '../user_address';

export interface Transactions {
  id: string;
  cashierID: string;
  driverID: string;
  customerID: string;
  type: TransactionType;
  orderList: OrderItems[];
  message: string;
  status: TransactionStatus;
  payment: Payment;
  details: TrasactionDetails[];
  shippingFee?: ShippingFee;
  address?: Address;
  createdAt: Date;
  updatedAt?: Date;
  schedule?: TransactionSchedule;
}

export const transactionConverter = {
  toFirestore: (data: Transactions) => data,
  fromFirestore: (snap: QueryDocumentSnapshot) => {
    const data = snap.data() as Transactions;

    if (data.createdAt instanceof Timestamp) {
      data.createdAt = data.createdAt.toDate();
    }

    if (data.updatedAt instanceof Timestamp) {
      data.updatedAt = data.updatedAt.toDate();
    }

    if (
      data.payment &&
      data.payment.details &&
      data.payment.details.createdAt instanceof Timestamp
    ) {
      data.payment.details.createdAt = data.payment.details.createdAt.toDate();
    }

    return data;
  },
};
