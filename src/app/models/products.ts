import { QueryDocumentSnapshot, Timestamp } from '@angular/fire/firestore';

import { v4 as uuidv4 } from 'uuid';
import { Variation } from './variation';
import { ShippingInfo } from './shipping';
import { OrderItems } from './transaction/order_items';
import { batchNumber } from './batchnumber';
import { WeightBasedPricing } from './weightBasedPricing';
import { PurchaseType } from './transaction/purchaseType';

export interface Products {
  id: string;
  images: string[];
  name: string;
  description: string;
  category: string;
  cost: number;
  price: number;
  stocks: number;
  stockAlert: number,
  batchNumber?: batchNumber[];
  variations: Variation[];
  expiryDate: Date | null;
  reviews: [];
  shippingInformation: ShippingInfo;
  featured: boolean;
  isHidden: boolean;
  createdAt: Date;
  updatedAt: Date | null;
  // Optional weight-based pricing
  weightPricing?: WeightBasedPricing;
}

export const productConverter = {
  toFirestore: (data: Products) => {
    const convertedData: Products = { ...data };

    // Set expiryDate from batchExpiry if not already set
    if (!convertedData.expiryDate && convertedData.batchNumber) {
      const earliestBatchExpiry = convertedData.batchNumber
        .filter(batch => batch.batchExpiry != null)  // Filter out null or undefined batchExpiry values
        .sort((a, b) => a.batchExpiry!.getTime() - b.batchExpiry!.getTime())[0];

      if (earliestBatchExpiry) {
        convertedData.expiryDate = earliestBatchExpiry.batchExpiry || null;  // Ensure it's a valid Date or null
      }
    }

    // Ensure proper conversion of Dates
    if (convertedData.createdAt instanceof Date) {
      convertedData.createdAt = new Date(convertedData.createdAt);
    }

    return { ...convertedData };
  },
  fromFirestore: (snap: QueryDocumentSnapshot) => {
    const data = snap.data() as Products;

    // Convert Firestore Timestamps to JavaScript Dates
    if (data.expiryDate instanceof Timestamp) {
      data.expiryDate = data.expiryDate.toDate();
    }

    if (data.createdAt instanceof Timestamp) {
      data.createdAt = data.createdAt.toDate();
    }

    if (data.updatedAt instanceof Timestamp) {
      data.updatedAt = data.updatedAt.toDate();
    }

    // Ensure default values for weight-based pricing
    if (data.weightPricing) {
      data.weightPricing.remainingWeight =
        data.weightPricing.remainingWeight ?? data.weightPricing.weight;
    }

    data.variations.forEach(variation => {
      if (variation.weightPricing) {
        variation.weightPricing.remainingWeight =
          variation.weightPricing.remainingWeight ?? variation.weightPricing.weight;
      }
    });

    return data;
  },
};

// export interface Variation {
//   id: string;
//   name: string;
//   image: string;
//   cost: number;
//   price: number;
//   stocks: number;
// }

export function productToOrder(product: Products): Order[] {
  let orderList: Order[] = [];

  // Determine if product has weight pricing
  const hasWeightPricing = product.weightPricing && product.weightPricing.weight && product.weightPricing.kgPrice;

  if (product.variations.length == 0) {
    // If there are no variations, we just add the product itself to the order
    orderList.push({
      productID: product.id,
      name: product.name,
      category: product.category,
      isVariation: false,
      variatioID: '',
      image: product.images[0],
      cost: product.cost,
      price: product.price,
      expiration: product.expiryDate,
      quantity: 1,
      stocks: product.stocks,
      shippingInfo: product.shippingInformation,
      weightPricing: product.weightPricing,
      purchaseType: hasWeightPricing ? PurchaseType.KG : PurchaseType.UNITS, // Set based on weight pricing
    });
  } else {
    // If variations exist, iterate over them and add each as an order item
    product.variations.forEach((variation) => {
      const hasVariationWeightPricing = variation.weightPricing && variation.weightPricing.weight && variation.weightPricing.kgPrice;

      orderList.push({
        productID: product.id,
        name: `${product.name} ${variation.name}`,
        category: product.category,
        isVariation: true,
        variatioID: variation.id,
        image: variation.image,
        expiration: product.expiryDate,
        cost: variation.cost,
        price: variation.price,
        quantity: 1,
        stocks: variation.stocks,
        shippingInfo: product.shippingInformation,
        weightPricing: variation.weightPricing,
        purchaseType: hasVariationWeightPricing ? PurchaseType.KG : PurchaseType.UNITS, // Set based on variation weight pricing
      });
    });
  }

  return orderList;
}

export interface Order {
  productID: string;
  name: string;
  category: string;
  isVariation: boolean;
  variatioID: string;
  image: string;
  cost: number;
  price: number;
  expiration: Date | null;
  quantity: number;
  stocks: number;
  shippingInfo: ShippingInfo;
  weightPricing?: WeightBasedPricing;  // Optional
  purchaseType?: PurchaseType;
}


