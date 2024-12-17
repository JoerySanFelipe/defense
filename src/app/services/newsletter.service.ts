import { Injectable } from '@angular/core';
import { NewsLetter, newsletterConverter } from '../models/newsletter';

import { updateDoc } from '@firebase/firestore';
import {
  Firestore,
  collection,
  deleteDoc,
  doc,
  orderBy,
  query,
  setDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { collectionData } from 'rxfire/firestore';
import {
  Storage,
  getDownloadURL,
  ref,
  uploadBytes,
} from '@angular/fire/storage';
import { v4 as uuidv4 } from 'uuid';
const NEWSLETTER_COLLECTION = 'newsletters';
@Injectable({
  providedIn: 'root',
})
export class NewsletterService {
  constructor(private firestore: Firestore, private storage: Storage) {}
  async saveNewsletter(newsLetter: NewsLetter, file: File | null) {
    if (file !== null) {
      const fireRef = ref(this.storage, `${NEWSLETTER_COLLECTION}/${uuidv4()}`);

      await uploadBytes(fireRef, file);
      const downloadURL = await getDownloadURL(fireRef);
      newsLetter.image = downloadURL;
    }
    return setDoc(
      doc(this.firestore, NEWSLETTER_COLLECTION, newsLetter.id).withConverter(
        newsletterConverter
      ),
      newsLetter
    );
  }

  getAllNewsLetter(): Observable<NewsLetter[]> {
    const q = query(
      collection(this.firestore, NEWSLETTER_COLLECTION),
      orderBy('createdAt', 'desc')
    ).withConverter(newsletterConverter);

    return collectionData(q) as Observable<NewsLetter[]>;
  }
  deleteNewsletter(newsLetterID: string) {
    return deleteDoc(doc(this.firestore, NEWSLETTER_COLLECTION, newsLetterID));
  }
  async editNewsletter(news: NewsLetter, file: File | null) {
    if (file !== null) {
      const fireRef = ref(this.storage, `${NEWSLETTER_COLLECTION}/${uuidv4()}`);

      await uploadBytes(fireRef, file);
      const downloadURL = await getDownloadURL(fireRef);
      news.image = downloadURL;
    }
    return setDoc(
      doc(this.firestore, NEWSLETTER_COLLECTION, news.id).withConverter(
        newsletterConverter
      ),
      news
    );
  }
}
