import { QueryDocumentSnapshot, Timestamp } from '@angular/fire/firestore';

export interface NewsLetter {
  id: string;
  description: string;
  image: string;
  createdAt: Date;
}

export const newsletterConverter = {
  toFirestore: (data: NewsLetter) => data,
  fromFirestore: (snap: QueryDocumentSnapshot) => {
    const data = snap.data() as NewsLetter;
    // Convert Firestore timestamp to JavaScript Date object
    if (data.createdAt instanceof Timestamp) {
      data.createdAt = data.createdAt.toDate();
    }
    return data;
  },
};
