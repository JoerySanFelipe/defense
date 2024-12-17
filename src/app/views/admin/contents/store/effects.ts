import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { TopicSubjectService } from 'src/app/services/topic-subject.service';
import { contentActions } from './actions';
import { catchError, exhaustMap, map, of } from 'rxjs';
import { ContentService } from 'src/app/services/content.service';

@Injectable()
export class ContentEffects {
  getAllTopicWithSubjects = createEffect(() =>
    this.actions$.pipe(
      ofType(contentActions.getSubjectWithTopics),
      exhaustMap(() =>
        this.topicSubjectService.getAllSubjectWithTopics().pipe(
          map((data) => contentActions.getSuccess({ result: data })),
          catchError((err) =>
            of(
              contentActions.getFailuire({
                message: err['message'].toString(),
              })
            )
          )
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private topicSubjectService: TopicSubjectService
  ) {}
}
