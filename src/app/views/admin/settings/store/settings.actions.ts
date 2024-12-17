import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { QRCodes } from 'src/app/models/payment-qr/qr-codes';

export const settingsAction = createActionGroup({
  source: 'settings',
  events: {
    'Get All Payments': emptyProps(),
    'Get All Payment Success': props<{ data: QRCodes[] }>(),
    'Get All Payment Failed': props<{ message: string }>(),
  },
});
