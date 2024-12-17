import { createFeature, createReducer, on } from '@ngrx/store';
import { INewsletterState } from '../types/newsletter.interface';
import { newsLetterActions } from './newsletter.actions';

const initialNewsletterState: INewsletterState = {
  isLoading: false,
  newsletters: [],
  errors: null,
};

const newsletterFeature = createFeature({
  name: 'newsletter',
  reducer: createReducer(
    initialNewsletterState,
    on(newsLetterActions.getAllNewsletters, (state) => ({
      ...state,
      isLoading: true,
    }))
  ),
});
