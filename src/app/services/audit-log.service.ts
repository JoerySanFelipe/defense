import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  orderBy,
  query,
  setDoc,
  where,
} from '@angular/fire/firestore';

import { Audit, AuditLogConverter } from '../models/audit/audit';
import { generateInvoiceID } from '../utils/constants';
import { collectionData, docData } from 'rxfire/firestore';
import { Observable } from 'rxjs';
export const AUDIT_TABLE = 'audit';
@Injectable({
  providedIn: 'root',
})
export class AuditLogService {
  private processedDocumentIds = new Set<string>();

  constructor(private firestore: Firestore) {}

  async createAudit(audit: Audit) {
    audit.id = generateInvoiceID();
    await setDoc(
      doc(collection(this.firestore, AUDIT_TABLE), audit.id),
      audit
    ).catch((err) => console.log(err.message));
  }
  // async saveAudit(audit: Audit) {
  //   audit.id = generateInvoiceID();
  //   await setDoc(
  //     doc(collection(this.firestore, AUDIT_TABLE), audit.id),
  //     audit
  //   ).catch((err) => console.log(err.message));
  // }

  getAllAudits(): Observable<Audit[]> {
    const q = query(
      collection(this.firestore, AUDIT_TABLE),
      orderBy('timestamp', 'desc')
    ).withConverter(AuditLogConverter);
    return collectionData(q) as Observable<Audit[]>;
  }
  getProductAdjustMents(id: string) {
    const q = query(
      collection(this.firestore, AUDIT_TABLE),
      where('component', '==', 'INVENTORY'),
      where('payload.productID', '==', id),
      orderBy('timestamp', 'desc')
    ).withConverter(AuditLogConverter);
    return collectionData(q) as Observable<Audit[]>;
  }

  getAuditByID(id: string): Observable<Audit> {
    const q = doc(this.firestore, AUDIT_TABLE, id).withConverter(
      AuditLogConverter
    );
    return docData(q) as Observable<Audit>;
  }
}
