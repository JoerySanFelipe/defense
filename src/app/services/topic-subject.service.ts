import { Injectable } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  deleteDoc,
  doc,
  orderBy,
  query,
  setDoc,
  where,
} from '@angular/fire/firestore';
import { TopicSubject, topicSubjectConverter } from '../models/TopicSubject';
import { generateInvoiceID } from '../utils/constants';
import {
  Storage,
  getDownloadURL,
  ref,
  uploadBytes,
} from '@angular/fire/storage';
import {
  Observable,
  catchError,
  combineLatest,
  concatMap,
  forkJoin,
  map,
  of,
  switchMap,
} from 'rxjs';
import { collectionData } from 'rxfire/firestore';
import { v4 as uuidv4 } from 'uuid';
import { Topic, topicConverted } from '../models/Topic';
import { ContentService, PEST_COLLECTION } from './content.service';
import { SubjectWithTopics } from '../models/SubjectWithTopics';
export const TOPIC_SUBJECT_COLLECTION = 'subjects';
@Injectable({
  providedIn: 'root',
})
export class TopicSubjectService {
  constructor(
    private firestore: Firestore,
    private storage: Storage,
    private contentService: ContentService
  ) {}

  deleteSubject(id: string) {
    return deleteDoc(doc(this.firestore, TOPIC_SUBJECT_COLLECTION, id));
  }

  async addSubject(subject: TopicSubject, file: File) {
    const ref = collection(this.firestore, TOPIC_SUBJECT_COLLECTION);
    const id = uuidv4();
    subject.id = id;
    const url = await this.upload(file);
    subject.cover = url;
    return setDoc(doc(ref, subject.id), subject);
  }

  getAllSubjectWithTopics(): Observable<SubjectWithTopics[]> {
    return combineLatest([
      this.contentService.getAllTopics(),
      this.getAllTopicSubject(),
    ]).pipe(
      map(([topics, subjects]) => {
        console.log('Topics:', topics);
        console.log('Subjects:', subjects);

        return subjects.map((subject) => {
          const filteredTopics = topics.filter(
            (topic) => topic.subjectID === subject.id
          );
          console.log(
            `Subject ID: ${subject.id}, Filtered Topics:`,
            filteredTopics
          );

          return {
            subject,
            topics: filteredTopics,
          };
        });
      })
    );
  }

  getAllTopicSubject(): Observable<TopicSubject[]> {
    const q = query(
      collection(this.firestore, TOPIC_SUBJECT_COLLECTION).withConverter(
        topicSubjectConverter
      ),
      orderBy('createdAt', 'asc')
    );
    return collectionData(q) as Observable<TopicSubject[]>;
  }

  async upload(file: File) {
    try {
      const fireRef = ref(
        this.storage,
        `${TOPIC_SUBJECT_COLLECTION}/${generateInvoiceID()}`
      );
      const result = await uploadBytes(fireRef, file);
      const downloadURL = await getDownloadURL(result.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }
}
