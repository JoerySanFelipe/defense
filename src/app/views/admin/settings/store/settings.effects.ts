import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of } from 'rxjs';
import { GcashPaymentService } from 'src/app/services/gcash-payment.service';
import { settingsAction } from './settings.actions';

@Injectable()
export class SettingsEffect {
  getAllPayments$ = createEffect(() =>
    this.actions$.pipe(
      ofType(settingsAction.getAllPayments),
      exhaustMap(() =>
        this.gcashPaymentService.getAllQrCode().pipe(
          map((data) => settingsAction.getAllPaymentSuccess({ data })),
          catchError((err) =>
            of(
              settingsAction.getAllPaymentFailed({
                message: err.message || 'An unknown error occurred',
              })
            )
          )
        )
      )
    )
  );
  constructor(
    private actions$: Actions,
    private gcashPaymentService: GcashPaymentService
  ) {}
}
