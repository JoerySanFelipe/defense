import { createFeature, createReducer, on } from '@ngrx/store';
import { IContentState } from '../types/content.interface';
import { contentActions } from './actions';

const initialContentState: IContentState = {
  isLoading: false,
  subjectWithTopic: [],
  errors: null,
};

const contentFeature = createFeature({
  name: 'content',
  reducer: createReducer(
    initialContentState,
    on(contentActions.getSubjectWithTopics, (state) => ({
      ...state,
      isLoading: true,
    })),
    on(contentActions.getSuccess, (state, actions) => ({
      ...state,
      isLoading: false,
      subjectWithTopic: actions.result,
    })),
    on(contentActions.getFailuire, (state, actions) => ({
      ...state,
      isLoading: false,
      errors: actions.message,
    }))
  ),
});

export const {
  name: contentFeatureKey,
  reducer: contentReducer,
  selectIsLoading,
  selectSubjectWithTopic,
  selectErrors,
} = contentFeature;
