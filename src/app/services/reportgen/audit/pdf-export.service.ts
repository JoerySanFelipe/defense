// pdf-export.service.ts

import { Injectable } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';
import * as pdfMake from 'pdfmake/build/pdfmake.js';
import * as pdfFonts from 'pdfmake/build/vfs_fonts.js';

(pdfMake as any).vfs = pdfFonts.pdfMake.vfs;
import { TDocumentDefinitions, PageOrientation } from 'pdfmake/interfaces';
import { Audit } from 'src/app/models/audit/audit';
import { CompanyInfoService } from '../company-info/company-info.service';

@Injectable({
  providedIn: 'root',
})
export class PdfExportService {
  constructor(private companyInfoService: CompanyInfoService) {}

  async exportToPdf(auditLog: Audit[], filename: string): Promise<void> {
    const logoImagePath = 'assets/images/logo.png'; // Update the path based on your project structure
    const logoImageDataURL = await this.getImageDataUrl(logoImagePath);
    const currentDate = new Date();

    const transformedData = auditLog.map((audit) => ({
      auditNo: audit.id || '---',
      username: audit.email || '---',
      role: audit.role || '---',
      component: audit.component || '---',
      action: audit.action || '---',
      timestamp: audit.timestamp ? audit.timestamp.toLocaleDateString() : '---',
    }));

    const documentDefinition: TDocumentDefinitions = {
      pageOrientation: 'landscape' as PageOrientation,
      content: [
        // Content for the Left Column
        {
          columns: [
            // Left Column
            {
              width: 'auto',
              stack: [
                { text: this.companyInfoService.getCompanyName(), bold: true },
                this.companyInfoService.getCompanyAddress(),
                this.companyInfoService.getCompanyEmail(),
                this.companyInfoService.getCompanyTelephone(),
                '\n',
                { text: `Exported by: ` },
                { text: `Exported At: ${currentDate.toLocaleString()}` },
                '\n',
              ],
            },
            // Right Column (Logo)
            {
              width: '*', // Take the remaining space
              stack: [
                {
                  image: logoImageDataURL,
                  width: 75,
                  absolutePosition: { x: 700, y: 20 },
                },
              ],
            },
          ],
        },
        // Content for the Table
        {
          table: {
            headerRows: 1,
            widths: ['*', 180, 60, 100, 60, 150],
            body: [
              [
                'Audit No.',
                'Email',
                'Role',
                'Component',
                'Action',
                'Timestamp',
              ],
              ...transformedData.map((element) => [
                element.auditNo,
                element.username,
                element.role,
                element.component,
                element.action,
                element.timestamp,
              ]),
            ],
          },
        },
      ],
    };

    pdfMake
      .createPdf(documentDefinition)
      .download(
        `${filename} - ${currentDate.toLocaleString().replace(/\//g, '-')}.pdf`
      );
  }

  private convertTimestamp(timestamp: Timestamp): string {
    // Timestamp conversion logic
    return timestamp.toDate().toLocaleString();
  }

  private async getImageDataUrl(imagePath: string): Promise<string> {
    const response = await fetch(imagePath);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
