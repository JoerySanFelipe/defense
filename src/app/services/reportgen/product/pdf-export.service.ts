import { Injectable } from '@angular/core';
import { CompanyInfoService } from '../company-info/company-info.service';
import { Timestamp } from '@angular/fire/firestore';
import * as pdfMake from 'pdfmake/build/pdfmake.js';
import * as pdfFonts from 'pdfmake/build/vfs_fonts.js';

(pdfMake as any).vfs = pdfFonts.pdfMake.vfs;
import { TDocumentDefinitions, PageOrientation } from 'pdfmake/interfaces';

import { Products } from 'src/app/models/products';
import { Variation } from 'src/app/models/variation';
import { Transactions } from 'src/app/models/transaction/transactions';
import { formatPrice } from 'src/app/utils/constants';
import { Users } from 'src/app/models/users';

@Injectable({
  providedIn: 'root',
})
export class PdfExportService {
  constructor(private companyInfoService: CompanyInfoService) {}

  async exportProductsToPdf(
    products: Products[],
    user: Users | null
  ): Promise<void> {
    const companyInfo = this.companyInfoService;
    const currentDate = new Date();
    const logoImagePath = 'assets/images/logo.png';
    const logoImageDataURL = await this.getImageDataUrl(logoImagePath);

    // Flatten the data to include variations as separate rows
    const transformedData = products.flatMap((product) => {
      if (product.variations && product.variations.length > 0) {
        return product.variations.map((variation) => ({
          name: `${product.name} - ${variation.name}`, // Product name + variation name
          category: product.category,
          price: variation.price,
          quantity: variation.stocks,
          expiryDate: product.expiryDate
            ? product.expiryDate.toLocaleDateString()
            : 'Non-Expiring', // Display 'Non-Expiring' if no expiry date
          availability: this.getAvailabilityStatus(variation), // Use variation for availability
        }));
      } else {
        return [
          {
            name: product.name,
            category: product.category,
            price: product.price,
            quantity: product.stocks,
            expiryDate: product.expiryDate
              ? product.expiryDate.toLocaleDateString()
              : 'Non-Expiring', // Display 'Non-Expiring' if no expiry date
            availability: this.getAvailabilityStatus(product), // Use product for availability
          },
        ];
      }
    });

    const documentDefinition: TDocumentDefinitions = {
      pageOrientation: 'landscape' as PageOrientation,
      content: [
        // Header with company info and user details
        {
          columns: [
            {
              width: 'auto',
              stack: [
                { text: companyInfo.getCompanyName(), bold: true },
                companyInfo.getCompanyAddress(),
                companyInfo.getCompanyEmail(),
                companyInfo.getCompanyTelephone(),
                '\n',
                { text: `Product Inventory Report` },
                { text: `Exported by: ${user?.name ?? 'Unknown User'}` },
                { text: `Exported At: ${currentDate.toLocaleString()}` },
                '\n',
              ],
            },
            // Right Column (Logo)
            {
              width: '*',
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

        // Table with product details
        {
          table: {
            headerRows: 1,
            widths: ['*', 80, 80, 60, 80, 150],
            body: [
              [
                'Product',
                'Category',
                'Price',
                'Quantity',
                'Expiry Date',
                'Availability',
              ],
              ...transformedData.map((item) => [
                item.name,
                item.category,
                formatPrice(item.price),
                item.quantity,
                item.expiryDate, // This will now show "Non-Expiring" if no expiry date
                item.availability,
              ]),
            ],
          },
        },
      ],
    };

    pdfMake.createPdf(documentDefinition).download(`products-report-${currentDate.toISOString().split('T')[0]}.pdf`);
  }

  private getAvailabilityStatus(product: Products | Variation): string {
    const stockCount =
      'stocks' in product && product.stocks !== undefined ? product.stocks : 0;
    const stockAlert =
      'stockAlert' in product && product.stockAlert !== undefined
        ? product.stockAlert
        : 0;

    // Determine expiration status
    const expirationDate =
      'expiryDate' in product && product.expiryDate
        ? new Date(product.expiryDate)
        : null; // Safely parse expiryDate if it exists

    if (expirationDate) {
      const currentDate = new Date();
      const diffTime = expirationDate.getTime() - currentDate.getTime();
      const diffDays = diffTime / (1000 * 3600 * 24); // Convert milliseconds to days

      // Check for expiration statuses first
      if (diffDays <= 60 && diffDays > 0) {
        return 'To be Expired';
      } else if (diffDays <= 0) {
        return 'Expired';
      }
    }

    // If not expired or about to expire, fallback to stock availability
    switch (true) {
      case stockCount > stockAlert:
        return 'In Stock';
      case stockCount <= stockAlert && stockCount > 0:
        return 'Low in Stock';
      default:
        return 'Out of Stock';
    }
  }

  private formatDate(date: Date | null): string {
    return date
      ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'Non-Expiring';
  }

  private async getImageDataUrl(imagePath: string): Promise<string> {
    const response = await fetch(imagePath);
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async exportTransaction(
    transactions: Transactions,
    users: Users | null
  ): Promise<void> {
    const companyInfo = this.companyInfoService;
    const currentDate = new Date();
    const logoImagePath = 'assets/images/logo.png';
    const logoImageDataURL = await this.getImageDataUrl(logoImagePath);

    // Calculate the sub-total
    const subTotal = transactions.orderList.reduce((acc, e) => {
      return acc + e.quantity * e.price;
    }, 0);

    const transformedData = transactions.orderList.map((e) => ({
      id: e.isVariation ? e.variationID : e.productID,
      name: e.productName,
      quantity: e.quantity,
      price: e.price,
    }));

    const documentDefinition: TDocumentDefinitions = {
      pageOrientation: 'landscape' as PageOrientation,
      content: [
        // Content for the Left Column
        {
          columns: [
            {
              width: 'auto',
              stack: [
                { text: companyInfo.getCompanyName(), bold: true },
                companyInfo.getCompanyAddress(),
                companyInfo.getCompanyEmail(),
                companyInfo.getCompanyTelephone(),
                '\n',
                { text: `Invoice ID: ${transactions.id}` },
                { text: `Cashier: ${users?.name ?? 'No cashier'}` },
                { text: `Type: ${transactions.type}` },
                { text: `Status: ${transactions.status}` },
                { text: `Transaction Date: ${currentDate.toLocaleString()}` },
                '\n',
              ],
            },
            // Right Column (Logo)
            {
              width: '*',
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

        // Table with the order details
        {
          table: {
            headerRows: 1,
            widths: ['*', '*', '*'],
            body: [
              ['NAME', 'QUANTITY', 'PRICE'],
              ...transformedData.map((item) => [
                item.name,
                item.quantity,
                formatPrice(item.price),
              ]),
            ],
          },
        },

        '\n',
        // Footer with Sub-Total, Discount, and Total at the bottom right
        {
          table: {
            widths: ['*', 'auto'],
            body: [
              // Sub-Total
              [
                { text: 'Sub-Total:', alignment: 'right', fontSize: 12 },
                {
                  text: formatPrice(subTotal),
                  alignment: 'right',
                  fontSize: 12,
                },
              ],
              // Discount
              [
                { text: 'Discount:', alignment: 'right', fontSize: 12 },
                {
                  text: `${transactions.payment.discount}%`,
                  alignment: 'right',
                  fontSize: 12,
                },
              ],
              // Total (bold)
              [
                {
                  text: 'Total:',
                  alignment: 'right',
                  fontSize: 12,
                  bold: true,
                },
                {
                  text: formatPrice(transactions.payment.amount),
                  alignment: 'right',
                  fontSize: 12,
                  bold: true,
                },
              ],
            ],
          },
          layout: 'noBorders', // Optionally use 'noBorders' for a cleaner footer
        },
      ],
    };

    pdfMake.createPdf(documentDefinition).open();
  }
}
