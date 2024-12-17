import { QueryDocumentSnapshot, Timestamp } from '@angular/fire/firestore';

export interface Topic {
  id: string;
  subjectID: string;
  title: string;
  desc: string;
  image: string;
  category: string;
  recomendations: string[];
  createdAt: Date;
  updatedAt?: Date;
  open: boolean;
}

export const topicConverted = {
  toFirestore: (data: Topic) => data,
  fromFirestore: (snap: QueryDocumentSnapshot) => {
    const data = snap.data() as Topic;
    if (data.createdAt instanceof Timestamp) {
      data.createdAt = data.createdAt.toDate();
    }
    if (data.updatedAt instanceof Timestamp) {
      data.updatedAt = data?.updatedAt.toDate();
    }
    return data;
  },
};

export interface Contents {
  id: string;
  title: string;
  description: string;
  image: string;
  show: boolean;
  createdAt: Date;
}

export const contentConverter = {
  toFirestore: (data: Contents) => data,
  fromFirestore: (snap: QueryDocumentSnapshot) => {
    const data = snap.data() as Contents;
    if (data.createdAt instanceof Timestamp) {
      data.createdAt = data.createdAt.toDate();
    }
    return data;
  },
};
