import { Injectable } from '@angular/core';
import {
  Firestore,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from '@angular/fire/firestore';
import {
  Storage,
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from '@angular/fire/storage';
import { generateInvoiceID } from '../utils/constants';
import {
  Contents,
  Topic,
  contentConverter,
  topicConverted,
} from '../models/Topic';
import { Observable, combineLatest, map, of, switchMap } from 'rxjs';
import { collectionData, docData } from 'rxfire/firestore';
import { Products, productConverter } from '../models/products';
import { PRODUCT_COLLECTION, ProductService } from './product.service';
import { TopicWithContents } from '../models/TopicWithProductRecommendationsAndContents';

export const PEST_COLLECTION = 'pest';
export const CONTENTS_COLLECTION = 'contents';
@Injectable({
  providedIn: 'root',
})
export class ContentService {
  constructor(
    private firestore: Firestore,
    private storage: Storage,
    private productService: ProductService
  ) {}

  show(topicID: string, current: boolean) {
    return updateDoc(doc(this.firestore, PEST_COLLECTION, topicID), {
      open: !current,
    });
  }
  async uploadImage(file: File) {
    try {
      const fireRef = ref(
        this.storage,
        `${PEST_COLLECTION}/${generateInvoiceID()}`
      );
      await uploadBytes(fireRef, file);
      const downloadURL = await getDownloadURL(fireRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async addTopic(pest: Topic, file: File | null) {
    if (file != null) {
      const url = await this.uploadImage(file);
      pest.image = url;
    }
    return setDoc(doc(this.firestore, PEST_COLLECTION, pest.id), pest);
  }
  async editTopic(id: string, topic: Topic, file: File | null) {
    if (file != null) {
      const url = await this.uploadImage(file);
      topic.image = url;
    }
    return updateDoc(doc(this.firestore, PEST_COLLECTION, id), {
      title: topic.title,
      desc: topic.desc,
      image: topic.image,
    });
  }

  getTopicContents(topicID: string): Observable<Contents[]> {
    const contentsRef = collection(
      this.firestore,
      `${PEST_COLLECTION}/${topicID}/${CONTENTS_COLLECTION}`
    ).withConverter(contentConverter);
    return collectionData(contentsRef) as Observable<Contents[]>;
  }

  getProductRecommendations(recommendations: string[]): Observable<Products[]> {
    recommendations.push('sample');
    const q = query(
      collection(this.firestore, PRODUCT_COLLECTION).withConverter(
        productConverter
      ),
      where('id', 'in', recommendations)
    );
    return collectionData(q);
  }

  getProductsNotInRecommendation(
    recommendations: string[]
  ): Observable<Products[]> {
    // Ensure recommendations is not empty
    if (recommendations.length === 0) {
      recommendations.push('SAMPLE');
    }

    // Split the recommendations array into chunks of 10 or less
    const chunkedRecommendations = this.chunkArray(recommendations, 10);

    // Perform a query for each chunk and merge the results
    const queries = chunkedRecommendations.map((chunk) => {
      const q = query(
        collection(this.firestore, PRODUCT_COLLECTION).withConverter(
          productConverter
        ),
        where('id', 'not-in', chunk)
      );
      return collectionData(q) as Observable<Products[]>;
    });

    // Combine the results of all queries into a single Observable
    return combineLatest(queries).pipe(map((results) => results.flat()));
  }

  // Helper function to split an array into chunks
  chunkArray<T>(array: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }
  getTopicWithContents(topicID: string): Observable<TopicWithContents> {
    const topicDoc = doc(
      this.firestore,
      PEST_COLLECTION,
      topicID
    ).withConverter(topicConverted);

    return docData(topicDoc).pipe(
      switchMap((topic: Topic) => {
        return combineLatest([
          this.getTopicContents(topicID),
          this.productService.getAllProducts(),
        ]).pipe(
          map(([contents, products]) => {
            let recommendedIDs = topic.recomendations || [];
            let recommended = products.filter((product) =>
              recommendedIDs.includes(product.id)
            );
            let notRecommended = products.filter(
              (product) => !recommendedIDs.includes(product.id)
            );

            return {
              topic,
              contents,
              recommended,
              notRecommended,
            } as TopicWithContents;
          })
        );
      })
    );
  }

  getAllTopics(): Observable<Topic[]> {
    const q = query(
      collection(this.firestore, PEST_COLLECTION).withConverter(topicConverted),
      orderBy('createdAt', 'desc')
    );
    return collectionData(q) as Observable<Topic[]>;
  }

  deleteContent(topicID: string, content: Contents) {
    return deleteDoc(
      doc(
        this.firestore,
        `${PEST_COLLECTION}/${topicID}/${CONTENTS_COLLECTION}`,
        content.id
      )
    ).then((data) => deleteObject(ref(this.storage, content.image)));
  }

  async deleteTopic(topic: Topic): Promise<void> {
    try {
      const batch = writeBatch(this.firestore);
      const contentsCollectionRef = collection(
        this.firestore,
        `${PEST_COLLECTION}/${topic.id}/${CONTENTS_COLLECTION}`
      ).withConverter(contentConverter);

      const contentsSnapshot = await getDocs(contentsCollectionRef);
      let images: string[] = [];
      contentsSnapshot.forEach((docSnapshot) => {
        batch.delete(docSnapshot.ref);
        let data = docSnapshot.data();
        if (data.image !== '') {
          images.push(data.image);
        }
      });

      const topicDocRef = doc(this.firestore, PEST_COLLECTION, topic.id);
      if (topic.image !== '') {
        images.push(topic.image);
      }
      batch.delete(topicDocRef);

      await batch.commit();

      // Delete images after batch commit
      const deleteImagePromises = images.map((imagePath) =>
        deleteObject(ref(this.storage, imagePath))
      );
      await Promise.all(deleteImagePromises);
    } catch (error) {
      console.error('Error deleting topic and its contents:', error);
      throw error;
    }
  }

  async addContent(topicID: string, content: Contents, file: File | null) {
    const batch = writeBatch(this.firestore);
    const contentRef = doc(
      collection(
        this.firestore,
        `${PEST_COLLECTION}/${topicID}/${CONTENTS_COLLECTION}`
      )
    );
    const contentID = contentRef.id;
    content.id = contentID;
    if (file != null) {
      const url = await this.uploadImage(file);
      content.image = url;
    }

    // Update the topic's updatedAt field
    batch.update(doc(this.firestore, PEST_COLLECTION, topicID), {
      updatedAt: new Date(),
    });

    // Add the new content document
    batch.set(
      doc(
        this.firestore,
        `${PEST_COLLECTION}/${topicID}/${CONTENTS_COLLECTION}`,
        contentID
      ),
      content
    );

    // Commit the batch
    return batch.commit();
  }

  updateVisibility(
    topicID: string,
    contentID: string,
    currentVisibility: boolean
  ) {
    const contentRef = doc(
      collection(
        this.firestore,
        `${PEST_COLLECTION}/${topicID}/${CONTENTS_COLLECTION}`
      ),
      contentID
    );
    return updateDoc(contentRef, {
      show: !currentVisibility,
    });
  }

  addRecommendation(topicID: string, productID: string) {
    const contentRef = doc(
      collection(this.firestore, PEST_COLLECTION),
      topicID
    );
    return updateDoc(contentRef, {
      recomendations: arrayUnion(productID),
    });
  }
  removeRecommendation(topicID: string, productID: string) {
    const contentRef = doc(
      collection(this.firestore, PEST_COLLECTION),
      topicID
    );
    return updateDoc(contentRef, {
      recomendations: arrayRemove(productID),
    });
  }
  async editContent(
    topicID: string,
    contentID: string,
    title: string,
    description: string,
    category: string,
    file: File | null
  ) {
    try {
      const contentRef = doc(
        this.firestore,
        `${PEST_COLLECTION}/${topicID}/${CONTENTS_COLLECTION}`,
        contentID
      );

      // Create an object to hold the updates
      const updates: any = {
        title: title,
        description: description,
        category: category,
      };

      // If there is a file, upload it and add the result to the updates
      if (file !== null) {
        const result = await this.uploadImage(file);
        updates.image = result;
      }

      return updateDoc(contentRef, updates);
    } catch (err: any) {
      throw new Error('Error updating content: ' + err['message']);
    }
  }
}
