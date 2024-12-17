import { Injectable } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  where,
} from '@angular/fire/firestore';
import { TargetSales } from '../models/sales/target-sales';
import { Observable, map } from 'rxjs';
import { collectionData } from 'rxfire/firestore';

const monthMap: { [key: string]: number } = {
  January: 1,
  February: 2,
  March: 3,
  April: 4,
  May: 5,
  June: 6,
  July: 7,
  August: 8,
  September: 9,
  October: 10,
  November: 11,
  December: 12,
};
const TARGET_SALES_COLLECTION = 'TargetSales';
@Injectable({
  providedIn: 'root',
})
export class TargetSalesService {
  constructor(private firestore: Firestore) {}

  addTargetSales(target: TargetSales) {
    return setDoc(
      doc(collection(this.firestore, TARGET_SALES_COLLECTION), target.id),
      target
    );
  }

  getAllTargetSales(year: string): Observable<TargetSales[]> {
    const q = query(
      collection(this.firestore, TARGET_SALES_COLLECTION),
      where('year', '==', year)
    );

    return collectionData(q).pipe(
      map((data: any[]) => {
        return data
          .map((doc: any) => {
            return {
              id: doc.id,
              sale: doc.sale,
              month: doc.month,
              year: doc.year,
            } as TargetSales;
          })
          .sort((a, b) => {
            return monthMap[a.month] - monthMap[b.month];
          });
      })
    );
  }
  deleteTargetSales(id: string) {
    return deleteDoc(doc(this.firestore, TARGET_SALES_COLLECTION, id));
  }
}
