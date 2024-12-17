import { QueryDocumentSnapshot } from '@angular/fire/firestore';
import { CustomerAddress } from './addresses';

export interface Customers {
  id: string;
  name: string;
  phone: string;
  email: string;
  profile: string;
  createdAt: Date;
  addresses: CustomerAddress[];
}
export const customerConverter = {
  toFirestore: (data: Customers) => data,
  fromFirestore: (snap: QueryDocumentSnapshot) => snap.data() as Customers,
};
