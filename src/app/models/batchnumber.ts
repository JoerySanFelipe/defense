export interface batchNumber {
    isActive?: boolean;
    batchNumber: string; // This is the unique identifier for the batch
    stock: number;      // Quantity of stock added for this batch
    addedDate: Date;     // Date when the stock was added
    batchExpiry?: Date | null; //Added optional Expiration Date for Monitoring
  }