// audit-excel-export.service.ts

import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { Timestamp } from '@angular/fire/firestore';
import { Audit } from 'src/app/models/audit/audit';
import { CompanyInfoService } from 'src/app/services/reportgen/company-info/company-info.service';

@Injectable({
  providedIn: 'root',
})
export class ExcelExportService {
  constructor(private companyInfoService: CompanyInfoService) {}

  exportToExcel(
    auditLog: Audit[],
    filename: string,
    companyInfo: CompanyInfoService
  ): Promise<void> {
    // Transform data for Excel format
    const transformedData = auditLog.map((audit) => ({
      'Audit No.': audit.id,
      Username: audit.email,
      Role: audit.role,
      Component: audit.component,
      Action: audit.action,
      Timestamp: audit.timestamp.toLocaleDateString(),
    }));

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(transformedData);
    const companyInfoWs: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([
      ['Company Name:', companyInfo.getCompanyName()],
      ['Company Address:', companyInfo.getCompanyAddress()],
      ['Company Email:', companyInfo.getCompanyEmail()],
      ['Company Telephone:', companyInfo.getCompanyTelephone()],
      ['Printed by:'],
      ['Printed At:', new Date().toLocaleString()],
      ['Signed by:'],
    ]);

    XLSX.utils.book_append_sheet(wb, companyInfoWs, 'Company Info');
    XLSX.utils.book_append_sheet(wb, ws, 'Audit Log');

    const currentDate = new Date();
    const excelFileName = `${filename} - ${currentDate
      .toLocaleString()
      .replace(/\//g, '-')}.xlsx`;

    // Wrap the XLSX.writeFile in a Promise to make it asynchronous
    return new Promise((resolve, reject) => {
      try {
        XLSX.writeFile(wb, excelFileName);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  private convertTimestamp(timestamp: Timestamp): string {
    // Timestamp conversion logic
    return timestamp.toDate().toLocaleString(); // or your preferred date format
  }
}
