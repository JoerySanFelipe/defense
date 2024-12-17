import { QueryDocumentSnapshot, Timestamp } from '@angular/fire/firestore';
import { batchNumber } from './batchnumber';
import { WeightBasedPricing } from './weightBasedPricing';

export interface Variation {
  id: string;
  name: string;
  image: string;
  cost: number;
  price: number;
  stocks: number;
  stockAlert: number;
  expiryDate?: Date | null;  // Optional expiry date for each variation
  batchNumber?: batchNumber[];  // Array of batch numbers
  weightPricing?: WeightBasedPricing;  // Optional weight-based pricing
}

export const variationConverter = {
  toFirestore: (data: Variation) => {
    const convertedData: Variation = { ...data };

    // If no expiryDate is set, use batchExpiry from batchNumber
    if (!convertedData.expiryDate && convertedData.batchNumber && convertedData.batchNumber.length > 0) {
      const earliestBatchExpiry = convertedData.batchNumber
        .filter(batch => batch.batchExpiry != null)
        .sort((a, b) => a.batchExpiry!.getTime() - b.batchExpiry!.getTime())[0];
    
      if (earliestBatchExpiry) {
        convertedData.expiryDate = earliestBatchExpiry.batchExpiry || null;
      }
    }

    // If no expiryDate is found and this is a new variation (no batch numbers), we keep it as null unless set manually
    if (!convertedData.expiryDate && !convertedData.batchNumber) {
      convertedData.expiryDate = null; // Only set null if no batch number exists
    }

    return { ...convertedData };
  },

  fromFirestore: (snap: QueryDocumentSnapshot) => {
    const data = snap.data() as Variation;

    // Convert Firestore Timestamps to JavaScript Dates if expiryDate is a Timestamp
    if (data.expiryDate instanceof Timestamp) {
      data.expiryDate = data.expiryDate.toDate();
    }

    // Ensure expiryDate is null if it is not set
    if (!data.expiryDate) {
      data.expiryDate = null;
    }

    return data;
  },
};