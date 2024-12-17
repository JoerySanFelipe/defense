import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  deleteDoc,
  doc,
  orderBy,
  query,
  setDoc,
  writeBatch,
} from '@angular/fire/firestore';
import { PaymentQr } from '../models/payments-qr';
import { Observable } from 'rxjs';
import { collectionData } from 'rxfire/firestore';
import {
  Storage,
  getDownloadURL,
  ref,
  uploadBytes,
} from '@angular/fire/storage';
import { uuidv4 } from '@firebase/util';
import { ToastrService } from 'ngx-toastr';

const PAYMENT_QR_COLLECTION = 'PaymentQR';
@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  constructor(
    private firestore: Firestore,
    private storage: Storage,
    private toastr: ToastrService
  ) {}
  async uploadPaymentQr(file: File) {
    try {
      const batch = writeBatch(this.firestore);

      // Generate UUID for payment QR ID
      const paymentQrId = uuidv4();

      // Upload the file to Cloud Storage
      const fireRef = ref(
        this.storage,
        `${PAYMENT_QR_COLLECTION}/${paymentQrId}`
      );
      await uploadBytes(fireRef, file);
      const downloadURL = await getDownloadURL(fireRef);

      // Create paymentQr object
      let paymentQr: PaymentQr = {
        id: paymentQrId,
        qr: downloadURL,
        createdAt: new Date(),
      };

      // Add paymentQr data to Firestore in the batch operation
      const paymentQrDocRef = doc(
        this.firestore,
        PAYMENT_QR_COLLECTION,
        paymentQrId
      );
      batch.set(paymentQrDocRef, paymentQr);

      return batch.commit();
    } catch (error) {
      console.error('Error uploading file or adding payment QR:', error);
      throw error;
    }
  }

  getAllPaymentQr(): Observable<PaymentQr[]> {
    const q = query(
      collection(this.firestore, PAYMENT_QR_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    return collectionData(q) as Observable<PaymentQr[]>;
  }
  async deletePaymentQr(paymentQrId: string): Promise<void> {
    try {
      await deleteDoc(doc(this.firestore, PAYMENT_QR_COLLECTION, paymentQrId));
    } catch (error) {
      console.error('Error deleting payment QR code:', error);
      this.toastr.error('Failed to delete payment QR code.');
      throw error;
    }
  }
}
