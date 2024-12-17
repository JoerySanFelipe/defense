import { Injectable } from '@angular/core';

import { v4 as uuidv4 } from 'uuid';
import { Products, productConverter } from '../models/products';
import {
  Firestore,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  docData,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
  writeBatch,
} from '@angular/fire/firestore';
import {
  Storage,
  deleteObject,
  getDownloadURL,
  listAll,
  ref,
  uploadBytes,
} from '@angular/fire/storage';

import {
  BehaviorSubject,
  Observable,
  catchError,
  forkJoin,
  switchMap,
} from 'rxjs';
import { collectionData } from 'rxfire/firestore';
import { OrderItems } from '../models/transaction/order_items';
import { Transactions } from '../models/transaction/transactions';
import { Variation } from '../models/variation';
import { Users } from '../models/users';
import { Audit } from '../models/audit/audit';
import { use } from 'echarts';
import { ActionType, ComponentType } from '../models/audit/audit_type';
import { AUDIT_TABLE } from './audit-log.service';
import { generateInvoiceID } from '../utils/constants';
export const PRODUCT_COLLECTION = 'products';
@Injectable({
  providedIn: 'root',
})
export class ProductService {
  _collection_name = 'products';

  private productSubject: BehaviorSubject<Products[]> = new BehaviorSubject<
    Products[]
  >([]);
  public products$: Observable<Products[]> = this.productSubject.asObservable();

  constructor(private firestore: Firestore, private storage: Storage) { }
  getAllProducts(): Observable<Products[]> {
    return collectionData(
      collection(this.firestore, this._collection_name).withConverter(
        productConverter
      )
    ) as Observable<Products[]>;
  }
  
  addProduct(product: Products) {
    return setDoc(
      doc(
        collection(this.firestore, this._collection_name),
        product.id
      ).withConverter(productConverter),
      product
    );
  }

  updateProductStock(productID: string, newStock: number) {
    const productRef = doc(this.firestore, 'products', productID); // Get document reference
    return updateDoc(productRef, { stock: newStock }); // Update the stock value to newStock (in this case, 0)
  }

  setProduct(product: Products[]) {
    this.productSubject.next(product);
  }

  async batchUpdateProductQuantity(orderItems: OrderItems[]) {
    const batch = writeBatch(this.firestore);

    for (const order of orderItems) {
      const productDocRef = doc(
        this.firestore,
        this._collection_name,
        order.productID
      ).withConverter(productConverter);

      try {
        const productDocSnapshot = await getDoc(productDocRef);
        if (productDocSnapshot.exists()) {
          const productData = productDocSnapshot.data();

          if (order.isVariation) {
            productData.variations.forEach((e) => {
              if (e.id === order.variationID) {
                e.stocks -= order.quantity;
              }
            });
          } else {
            productData.stocks -= order.quantity;
          }
          productData.updatedAt = new Date();
          await updateDoc(productDocRef, productData);
        }
      } catch (error) {
        console.error('Error updating product: ', error);
      }
    }
    try {
      await batch.commit();
    } catch (error) {
      console.error('Error committing batch: ', error);
    }
  }

  // listenToProduct(productID: string) {
  //   console.log(productID);
  //   const productDocRef = doc(
  //     collection(this.firestore, this._collection_name),
  //     productID
  //   ).withConverter(productConverter);
  //   return docData(productDocRef, { id: productID });
  // }

  addToFeaturedProduct(productID: string) {
    const product = doc(
      collection(this.firestore, this._collection_name),
      productID
    );
    return updateDoc(product, {
      featured: true,
      updatedAt: new Date(),
    });
  }

  removeFromFeaturedProduct(productID: string) {
    const product = doc(
      collection(this.firestore, this._collection_name),
      productID
    );
    return updateDoc(product, {
      featured: false,
      updatedAt: new Date(),
    });
  }
  updateProduct(product: Products) {
    product.updatedAt = new Date();

    const productRef = doc(
      this.firestore,
      this._collection_name,
      product.id
    ).withConverter(productConverter);

    return updateDoc(productRef, { ...product }) // Only updates provided fields
      .catch((error) => {
        console.error('Error updating product:', error);
        throw error;
      });
  }

  deleteProduct(id: string) {
    return deleteDoc(
      doc(collection(this.firestore, this._collection_name), id)
    );
  }
  async uploadProductImages(
    files: File[],
    productID: string
  ): Promise<string[]> {
    const downloadURLs: string[] = [];
    try {
      for (const file of files) {
        const fireRef = ref(
          this.storage,
          `${this._collection_name}/${productID}/${uuidv4()}`
        );
        await uploadBytes(fireRef, file);
        const downloadURL = await getDownloadURL(fireRef);
        downloadURLs.push(downloadURL);
      }

      return downloadURLs;
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    }
  }

  async uploadsSingleProductImage(productID: string, file: File) {
    try {
      const fireRef = ref(
        this.storage,
        `${this._collection_name}/${productID}/${uuidv4()}`
      );
      await uploadBytes(fireRef, file);
      const downloadURL = await getDownloadURL(fireRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }
  async uploadVariationImage(productID: string, file: File) {
    try {
      const fireRef = ref(
        this.storage,
        `${this._collection_name}/${productID}/variation/${uuidv4()}`
      );

      await uploadBytes(fireRef, file);
      const downloadURL = await getDownloadURL(fireRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  deleteImage(path: string) {
    const fireRef = ref(this.storage, path);
    return deleteObject(fireRef);
  }

  deleteProductByID(productID: string) {
    const folder = ref(this.storage, `${this._collection_name}/${productID}`);
    const storageDelete = listAll(folder).then((data) => {
      data.items.forEach((element) => {
        deleteObject(element);
      });
    });
    const firestoreDelete = deleteDoc(
      doc(collection(this.firestore, this._collection_name), productID)
    );
    return forkJoin([storageDelete, firestoreDelete]);
  }

  addStocks(
    productID: string,
    stocks: number,
    variation: Variation[],
    expiration: Date
  ) {
    const productRef = doc(this.firestore, this._collection_name, productID);
    return updateDoc(productRef, {
      stocks: stocks,
      variations: variation,
      expiryDate: expiration,
      updatedAt: new Date(),
    });
  }

  getProductByID(productID: string): Observable<Products> {
    return docData(
      doc(
        collection(this.firestore, this._collection_name),
        productID
      ).withConverter(productConverter)
    ) as Observable<Products>;
  }

  hideProduct(productID: string, value: boolean) {
    return updateDoc(doc(this.firestore, this._collection_name, productID), {
      isHidden: value,
      updatedAt: new Date(),
    });
  }

  addVariation(productID: string, variation: Variation, user: Users) {
    const batch = writeBatch(this.firestore);

    const audit: Audit = {
      id: generateInvoiceID(),
      email: user.email,
      role: user.type,
      action: ActionType.MODIFY,
      component: ComponentType.INVENTORY,
      payload: { productID, variation },
      details: `${user.name} added a variation`,
      timestamp: new Date(),
    };

    // Add audit log
    batch.set(doc(this.firestore, AUDIT_TABLE, audit.id), audit);

    // Update product variations
    const productRef = doc(this.firestore, this._collection_name, productID);
    batch.update(productRef, {
      variations: arrayUnion(variation),
      updatedAt: new Date(),
    });

    return batch.commit()
      .then(() => {
        console.log('Variation added successfully.');
      })
      .catch((error) => {
        console.error('Error adding variation:', error);
        throw error;
      });
  }

  deleteVariation(productID: string, variation: Variation, user: Users) {
    let batch = writeBatch(this.firestore);
    let audit: Audit = {
      id: generateInvoiceID(),
      email: user.email,
      role: user.type,
      action: ActionType.DELETE,
      component: ComponentType.INVENTORY,
      payload: {
        productID: productID,
        variation: variation,
      },
      details: `${user.name} deleted a variation`,
      timestamp: new Date(),
    };
    batch.set(doc(this.firestore, AUDIT_TABLE, audit.id), audit);
    batch.update(doc(this.firestore, this._collection_name, productID), {
      variations: arrayRemove(variation),
      updatedAt: new Date(),
    });
    deleteObject(ref(this.storage, variation.image));
    return batch.commit();
  }

  updateVariation(productID: string, variations: Variation[], user: Users) {
    let batch = writeBatch(this.firestore);
    let audit: Audit = {
      id: generateInvoiceID(),
      email: user.email,
      role: user.type,
      action: ActionType.MODIFY,
      component: ComponentType.INVENTORY,
      payload: {
        productID: productID,
        variations: variations,
      },
      details: `${user.name} edit variations`,
      timestamp: new Date(),
    };
    batch.set(doc(this.firestore, AUDIT_TABLE, audit.id), audit);
    batch.update(doc(this.firestore, this._collection_name, productID), {
      variations: variations,
      updatedAt: new Date(),
    });
    return batch.commit();
  }

  setProductExpiryDate(product: Products): Products {
    if (product.batchNumber && product.batchNumber.length > 0) {
      // Filter out undefined batchExpiry values and find the earliest batchExpiry date
      const earliestBatchExpiry = product.batchNumber
        .filter(batch => batch.batchExpiry !== undefined)  // Ensure batchExpiry is not undefined
        .sort((a, b) => a.batchExpiry!.getTime() - b.batchExpiry!.getTime())[0]; // Safely access batchExpiry
  
      // Assign expiryDate only if earliestBatchExpiry.batchExpiry is defined
      if (earliestBatchExpiry?.batchExpiry) {
        product.expiryDate = earliestBatchExpiry.batchExpiry;
      }
    }
    return product;
  }  
}
