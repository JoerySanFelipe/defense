import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { SubjectWithTopics } from 'src/app/models/SubjectWithTopics';
import { Contents, Topic } from 'src/app/models/Topic';
import { TopicSubject } from 'src/app/models/TopicSubject';

export const contentActions = createActionGroup({
  source: 'content',
  events: {
    'Get Subject With Topics': emptyProps(),
    'Get Success': props<{ result: SubjectWithTopics[] }>(),
    'Get Failuire': props<{ message: string }>(),
  },
});
