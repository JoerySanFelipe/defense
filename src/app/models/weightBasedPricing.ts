export interface WeightBasedPricing {
    weight: number; // Weight per unit in kg, e.g., 25
    kgPrice: number; // Price per kilogram
    remainingWeight?: number; // Remaining weight in the last stock unit
  }
  