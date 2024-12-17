import { QueryDocumentSnapshot, Timestamp } from '@angular/fire/firestore';

export interface QRCodes {
  id: string;
  phone: string;
  name: string;
  qrCode: string;
  isDefault: boolean;
  createdAt: Date;
}
export const QrCodeConverter = {
  toFirestore: (data: QRCodes) => data,
  fromFirestore: (snap: QueryDocumentSnapshot) => {
    const data = snap.data() as QRCodes;

    if (data.createdAt instanceof Timestamp) {
      data.createdAt = data.createdAt.toDate();
    }
    return data;
  },
};
