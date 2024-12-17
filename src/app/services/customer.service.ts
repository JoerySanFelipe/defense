import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  getDoc,
} from '@angular/fire/firestore';

import { Customers, customerConverter } from '../models/customers';
import { Observable } from 'rxjs';
import { docData } from 'rxfire/firestore';

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  customer_table = 'customers';
  constructor(private firestore: Firestore) {}

  getCustomerInfo(customerID: string): Observable<Customers> {
    return docData(
      doc(
        collection(this.firestore, this.customer_table),
        customerID
      ).withConverter(customerConverter)
    ) as Observable<Customers>;
  }
  getAllCustomer(): Observable<Customers[]> {
    return collectionData(
      collection(this.firestore, 'customers')
    ) as Observable<Customers[]>;
  }
}
