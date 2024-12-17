import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import {
  Firestore,
  orderBy,
  query,
  where,
  collection,
  or,
  getDoc,
  doc,
  addDoc,
} from '@angular/fire/firestore';
import { collectionData } from 'rxfire/firestore';
import {
  BehaviorSubject,
  Observable,
  Subscription,
  combineLatest,
  map,
} from 'rxjs';
import { Messages } from '../models/messages';
import { Customers, customerConverter } from '../models/customers';
import { UserWithMessages } from '../models/UserWithMessages';

@Injectable({
  providedIn: 'root',
})
export class MessagesService {
  private messagesSubject = new BehaviorSubject<UserWithMessages[]>([]);
  messages$ = this.messagesSubject.asObservable();
  constructor(private auth: Auth, private firestore: Firestore) {}

  getCustomerWithMessages(uid: string): Observable<UserWithMessages[]> {
    return combineLatest([
      this.getAllCustomer(),
      this.getAllMyMessages(uid),
    ]).pipe(
      map(([customers, messages]) => {
        const customersWithMessages = customers.map((customer) => {
          const customerMessages = messages.filter(
            (msg) =>
              msg.senderID === customer.id || msg.receiverID === customer.id
          );
          return {
            customers: customer,
            messages: customerMessages.reverse(),
          };
        });

        customersWithMessages.sort((a, b) => {
          const lastMessageTimestampA =
            a.messages.length > 0
              ? a.messages[a.messages.length - 1].createdAt.toDate().getTime()
              : 0;
          const lastMessageTimestampB =
            b.messages.length > 0
              ? b.messages[b.messages.length - 1].createdAt.toDate().getTime()
              : 0;
          return lastMessageTimestampB - lastMessageTimestampA;
        });

        return customersWithMessages;
      })
    );
  }

  getAllMyMessages(uid: string): Observable<Messages[]> {
    const q = query(
      collection(this.firestore, 'messages'),
      or(where('senderID', '==', uid), where('receiverID', '==', uid)),
      orderBy('createdAt', 'desc')
    );
    return collectionData(q) as Observable<Messages[]>;
  }
  getAllCustomer(): Observable<Customers[]> {
    return collectionData(
      collection(this.firestore, 'customers')
    ) as Observable<Customers[]>;
  }

  updateMessages(messages: UserWithMessages[]) {
    this.messagesSubject.next(messages);
  }

  getCustomerByID(customerID: string) {
    return getDoc(
      doc(collection(this.firestore, 'customers'), customerID).withConverter(
        customerConverter
      )
    );
  }

  getAllConversationByID(convoID: string): Observable<Messages[]> {
    const q = query(
      collection(this.firestore, 'messages'),
      where('id', '==', convoID),
      orderBy('createdAt', 'desc')
    );
    return collectionData(q) as Observable<Messages[]>;
  }

  sendMessage(message: Messages): Promise<any> {
    return addDoc(collection(this.firestore, 'messages'), message);
  }
}
