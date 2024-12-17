import { SubjectWithTopics } from 'src/app/models/SubjectWithTopics';

export interface IContentState {
  isLoading: boolean;
  subjectWithTopic: SubjectWithTopics[];
  errors: string | null;
}
