import { QueryDocumentSnapshot, Timestamp } from '@angular/fire/firestore';

export interface TopicSubject {
  id: string;
  name: string;
  cover: string;
  createdAt: Date;
}
export const topicSubjectConverter = {
  toFirestore: (data: TopicSubject) => data,
  fromFirestore: (snap: QueryDocumentSnapshot) => {
    const data = snap.data() as TopicSubject;
    if (data.createdAt instanceof Timestamp) {
      data.createdAt = data.createdAt.toDate();
    }
    return data;
  },
};
