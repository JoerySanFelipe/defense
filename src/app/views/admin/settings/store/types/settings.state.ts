import { QRCodes } from 'src/app/models/payment-qr/qr-codes';

export interface SettingsState {
  isLoading: boolean;
  qrCodes: QRCodes[];
  errors: string | null;
}
