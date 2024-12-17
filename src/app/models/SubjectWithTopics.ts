import { Topic } from './Topic';
import { TopicSubject } from './TopicSubject';

export interface SubjectWithTopics {
  subject: TopicSubject;
  topics: Topic[];
}
