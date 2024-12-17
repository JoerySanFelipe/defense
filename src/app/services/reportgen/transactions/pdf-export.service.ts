// Import statements...
import { Injectable } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';
import { timestamp } from 'rxjs';
import * as pdfMake from 'pdfmake/build/pdfmake.js';
import * as pdfFonts from 'pdfmake/build/vfs_fonts.js';

(pdfMake as any).vfs = pdfFonts.pdfMake.vfs;
import {
  TDocumentDefinitions,
  PageOrientation,
  TableCell,
  Table,
} from 'pdfmake/interfaces';
import { OrderItems } from '../../../models/transaction/order_items';
import { CompanyInfoService } from '../company-info/company-info.service';

@Injectable({
  providedIn: 'root',
})
export class PdfExportService {
  [x: string]: any;
  constructor(private companyInfoService: CompanyInfoService) {}

  testExport(table: Table) {
    let documentDefinition: TDocumentDefinitions = {
      content: [
        {
          table: table,
        },
      ],
    };
    pdfMake.createPdf(documentDefinition).download(`testlang.pdf`);
  }

  async exportToPdf({
    data,
    filename,
    companyInfo,
    cashierName,
  }: {
    data: any[];
    filename: string;
    companyInfo: CompanyInfoService;
    cashierName: string;
  }): Promise<void> {
    const logoImagePath = 'assets/images/logo.png';
    const logoImageDataURL = await this.getImageDataUrl(logoImagePath);
    const currentDate = new Date();

    const transformedData = data.flatMap((transaction: any) =>
      transaction.orderList.map((order: OrderItems) => ({
        orderId: transaction.id || '---',
        customerName: '---',
        productName: order.productName || '---',
        quantity: order.quantity || '---',
        orderValue:
          order.quantity !== undefined && order.price !== undefined
            ? order.quantity * order.price
            : '---',
        timestamp: transaction.createdAt
          ? this.convertTimestamp(transaction.createdAt)
          : '---',
      }))
    );

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
                { text: companyInfo.getCompanyName(), bold: true },
                companyInfo.getCompanyAddress(),
                companyInfo.getCompanyEmail(),
                companyInfo.getCompanyTelephone(),
                '\n',
                { text: `Printed by: ${cashierName}` },
                { text: `Printed At: ${currentDate.toLocaleString()}` },
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
            widths: ['*', 60, 180, 50, 80, 150],
            body: [
              [
                'Order Details',
                'Customer',
                'Product',
                'Quantity',
                'Order Value',
                'Timestamp',
              ],
              ...transformedData.map((element) => [
                element.orderId,
                element.customerName,
                element.productName,
                element.quantity,
                element.orderValue,
                element.timestamp,
              ]),
            ],
          },
        },
        // Footer Left Column (Signed by)
        {
          columns: [
            {
              width: 'auto',
              stack: [
                {
                  text: `\nNumber of Transactions: ${transformedData.length}`,
                  bold: true,
                },
              ],
            },
          ],
        },
        {
          columns: [
            {
              width: 'auto',
              stack: [
                {
                  text: `\nTotal Product Sold: ${this.calculateTotalQuantitySold(
                    transformedData
                  )}`,
                  bold: true,
                },
              ],
            },
          ],
        },

        {
          columns: [
            {
              width: 'auto',
              stack: [
                {
                  text: `\nTotal Sales: ${this.calculateTotalSales(
                    transformedData
                  )}`,
                  bold: true,
                },
              ],
            },
          ],
        },

        {
          columns: [
            {
              width: 'auto',
              stack: [
                {
                  text: `\nTop 3 Most Sold Products:\n${this.getTop3MostSoldProducts(
                    transformedData
                  )}`,
                  bold: true,
                },
              ],
            },
          ],
        },

        {
          columns: [
            {
              width: 'auto',
              stack: [
                {
                  text: `\nTop 3 Least Sold Products:\n${this.getTop3LeastSoldProducts(
                    transformedData
                  )}`,
                  bold: true,
                },
              ],
            },
          ],
        },
        // Footer Right Column (Total Sales)
        {
          columns: [
            {
              width: '*', // Take the remaining space
              stack: [
                { text: '\nSigned by: _____________________', bold: true },
              ],
            },
          ],
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

  private getTop3MostSoldProducts(data: any[]): string {
    const productSoldMap: { [key: string]: number } = {};

    data.forEach((element) => {
      const productName = element.productName || 'Unknown Product';
      productSoldMap[productName] =
        (productSoldMap[productName] || 0) + (element.quantity || 0);
    });

    const top3MostSoldProducts = Object.keys(productSoldMap)
      .sort((a, b) => productSoldMap[b] - productSoldMap[a])
      .slice(0, 3)
      .map(
        (productName, index) =>
          `${index + 1}. ${productName} - ${productSoldMap[productName]}`
      )
      .join('\n');

    return top3MostSoldProducts || 'No Product Sold';
  }

  private getTop3LeastSoldProducts(data: any[]): string {
    const productSoldMap: { [key: string]: number } = {};

    data.forEach((element) => {
      const productName = element.productName || 'Unknown Product';
      productSoldMap[productName] =
        (productSoldMap[productName] || 0) + (element.quantity || 0);
    });

    const top3LeastSoldProducts = Object.keys(productSoldMap)
      .sort((a, b) => productSoldMap[a] - productSoldMap[b])
      .slice(0, 3)
      .map(
        (productName, index) =>
          `${index + 1}. ${productName} - ${productSoldMap[productName]}`
      )
      .join('\n');

    return top3LeastSoldProducts || 'No Product Sold';
  }

  private calculateTotalQuantitySold(data: any[]): number {
    return data.reduce((total, element) => total + (element.quantity || 0), 0);
  }

  private calculateTotalSales(data: any[]): number {
    return data.reduce((total, element) => total + element.orderValue, 0);
  }
}
