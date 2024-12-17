import { Injectable } from '@angular/core';
import {
  collection,
  doc,
  Firestore,
  getDocs,
  orderBy,
  query,
  setDoc,
  where,
  writeBatch,
} from '@angular/fire/firestore';
import { QrCodeConverter, QRCodes } from '../models/payment-qr/qr-codes';
import {
  getDownloadURL,
  ref,
  Storage,
  uploadBytes,
} from '@angular/fire/storage';
import { v4 as uuidv4 } from 'uuid';
import { newsletterConverter } from '../models/newsletter';
import { Observable } from 'rxjs';
import { collectionData } from 'rxfire/firestore';

export const GCASH_COLLECTION = 'gcash-codes';
@Injectable({
  providedIn: 'root',
})
export class GcashPaymentService {
  constructor(private firestore: Firestore, private storage: Storage) {}
  async addGcashPayment(qrCode: QRCodes, file: File) {
    const id = uuidv4();
    qrCode.id = id;
    const fireRef = ref(this.storage, `${GCASH_COLLECTION}/${id}`);

    try {
      await uploadBytes(fireRef, file);
      const downloadURL = await getDownloadURL(fireRef);
      qrCode.qrCode = downloadURL;
      await setDoc(
        doc(this.firestore, GCASH_COLLECTION, qrCode.id).withConverter(
          QrCodeConverter
        ),
        qrCode
      );
      return true; // Indicate success
    } catch (error) {
      console.error('Error adding GCash payment:', error);
      return false; // Indicate failure
    }
  }
  getAllQrCode(): Observable<QRCodes[]> {
    const q = query(
      collection(this.firestore, GCASH_COLLECTION).withConverter(
        QrCodeConverter
      ),
      orderBy('createdAt', 'desc')
    );
    return collectionData(q) as Observable<QRCodes[]>;
  }

  updateDefault(qrID: string) {
    const ref = collection(this.firestore, GCASH_COLLECTION).withConverter(
      QrCodeConverter
    );

    // Step 1: Query all QR codes that are currently set as default
    const q = query(ref, where('isDefault', '==', true));
    getDocs(q)
      .then((querySnapshot) => {
        const batch = writeBatch(this.firestore);

        // Step 2: Update all current default QR codes to set isDefault to false
        querySnapshot.forEach((doc) => {
          batch.update(doc.ref, { isDefault: false });
        });

        // Step 3: Set the new QR code as default
        const newDefaultRef = doc(
          this.firestore,
          `${GCASH_COLLECTION}/${qrID}`
        ).withConverter(QrCodeConverter);
        batch.update(newDefaultRef, { isDefault: true });

        // Commit the batch
        batch
          .commit()
          .then(() => {
            console.log('Default QR code updated successfully!');
          })
          .catch((error) => {
            console.error('Error updating default QR code:', error);
          });
      })
      .catch((error) => {
        console.error('Error fetching current default QR codes:', error);
      });
  }
}
