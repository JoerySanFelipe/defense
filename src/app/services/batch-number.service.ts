import { Injectable } from '@angular/core';
import { batchNumber } from '../models/batchnumber';
import { ProductService } from './product.service';
import { Products } from '../models/products';

@Injectable({
  providedIn: 'root',
})
export class BatchNumberService {
  constructor(private productService: ProductService) {}

  // Generate a random 6-digit unique batch ID
  private generateUniqueBatchId(): number {
    return Math.floor(100000 + Math.random() * 900000);
  }

  // Utility method to calculate the earliest batch expiry date
  private getEarliestBatchExpiry(batchNumbers: batchNumber[]): Date | null {
    const validExpiries = batchNumbers
      .filter((batch) => batch.batchExpiry)
      .map((batch) => batch.batchExpiry as Date);

    return validExpiries.length
      ? validExpiries.sort((a, b) => a.getTime() - b.getTime())[0]
      : null;
  }

  // Generate a new batch number with the provided details
  generateBatchNumber(
    productId: string,
    currentDate: Date,
    lastSequence: number,
    stock: number,
    batchExpiry: Date | null
  ): batchNumber {
    const dateStr = currentDate.toISOString().split('T')[0].replace(/-/g, '');
    const productIdLast4 = productId.slice(-4);
    const uniqueBatchId = this.generateUniqueBatchId();
    const uniqueBatchIdStr = uniqueBatchId.toString().padStart(6, '0');
    const sequenceStr = (lastSequence + 1).toString().padStart(3, '0');

    const batchNumberStr = `${uniqueBatchIdStr}-${productIdLast4}-${dateStr}-${sequenceStr}`;

    return {
      batchNumber: batchNumberStr,
      stock: stock,
      addedDate: currentDate,
      batchExpiry: batchExpiry ? new Date(batchExpiry) : null, // Ensure valid date
    };
  }

  // Add a new batch number to a product or its variation
  async addNewBatchNumber(
    product: Products,
    variationId: string | null,
    batchData: batchNumber,
    batchExpiry: Date | null
  ): Promise<void> {
    if (variationId) {
      const variation = product.variations.find((v) => v.id === variationId);
      if (variation) {
        variation.batchNumber = variation.batchNumber || [];
        variation.batchNumber.push(batchData);

        // Update variation.expiryDate with the earliest batchExpiry
        const earliestBatchExpiry = this.getEarliestBatchExpiry(
          variation.batchNumber
        );
        variation.expiryDate = earliestBatchExpiry || null;
      }
    } else if (!product.variations.length) {
      // For products without variations
      product.batchNumber = product.batchNumber || [];
      product.batchNumber.push(batchData);
    }

    try {
      await this.productService.updateProduct(product);
      console.log('Product updated successfully');
    } catch (error) {
      console.error('Error updating product:', error);
    }
  }
}
