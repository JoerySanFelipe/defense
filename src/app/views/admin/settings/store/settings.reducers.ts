import { createFeature, createReducer, on } from '@ngrx/store';
import { SettingsState } from './types/settings.state';
import { settingsAction } from './settings.actions';

const settingsInitialState: SettingsState = {
  isLoading: false,
  qrCodes: [],
  errors: null,
};

const settingsFeature = createFeature({
  name: 'settings',
  reducer: createReducer(
    settingsInitialState,
    on(settingsAction.getAllPayments, (state) => ({
      ...state,
      isLoading: true,
    })),
    on(settingsAction.getAllPaymentSuccess, (state, actions) => ({
      ...state,
      isLoading: false,
      qrCodes: actions.data,
    })),
    on(settingsAction.getAllPaymentFailed, (state, actions) => ({
      ...state,
      isLoading: false,
      errors: actions.message,
    }))
  ),
});

export const {
  name: settingsFeatureKey,
  reducer: settingsReducer,
  selectIsLoading,
  selectQrCodes,
  selectErrors,
} = settingsFeature;
