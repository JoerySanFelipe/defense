import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { NewsLetter } from 'src/app/models/newsletter';

export const newsLetterActions = createActionGroup({
  source: 'newsletter',
  events: {
    'Get All Newsletters': emptyProps(),
    'Get Newsletters Success': props<{ result: NewsLetter[] }>(),
    'Get Newsletters Failuire': props<{ message: string }>(),
  },
});
