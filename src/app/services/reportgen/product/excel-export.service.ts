import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { CompanyInfoService } from '../company-info/company-info.service';
import { Products } from 'src/app/models/products';
import { AuthService } from 'src/app/services/auth.service'; // Import AuthService
import { Users } from 'src/app/models/users'; // Import Users model
import { Variation } from 'src/app/models/variation';

@Injectable({
  providedIn: 'root',
})
export class ExcelExportService {
  private currentUser: Users | null = null;

  constructor(private authService: AuthService) {
    // Subscribe to the users$ observable to get the current user's info
    this.authService.users$.subscribe((user) => {
      this.currentUser = user;
    });
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

  private formatPrice(price: number): string {
    // Format price as a currency (e.g., "₱1,234.56")
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PHP',
    }).format(price);
  }

  async exportToExcel(
    products: Products[],
    filename: string,
    companyInfo: CompanyInfoService
  ): Promise<void> {
    // Transform data for Excel format, flattening products with variations
    const transformedData = products.flatMap((product) => {
      if (product.variations && product.variations.length > 0) {
        return product.variations.map((variation) => ({
          Name: `${product.name} - ${variation.name}`, // Product name + variation name
          Category: product.category,
          Price: this.formatPrice(variation.price), // Format price for variation
          Quantity: variation.stocks,
          'Expiry Date': product.expiryDate ? product.expiryDate.toLocaleDateString() : 'Non-Expiring',
          Availability: this.getAvailabilityStatus(variation), // Use variation for availability
        }));
      } else {
        return [
          {
            Name: product.name,
            Category: product.category,
            Price: this.formatPrice(product.price), // Format price for product
            Quantity: product.stocks,
            'Expiry Date': product.expiryDate ? product.expiryDate.toLocaleDateString() : 'Non-Expiring',
            Availability: this.getAvailabilityStatus(product), // Use product for availability
          },
        ];
      }
    });

    // Create workbook and sheets
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(transformedData);

    // Add company info sheet
    const companyInfoSheetData = [
      ['Company Name:', companyInfo.getCompanyName()],
      ['Company Address:', companyInfo.getCompanyAddress()],
      ['Company Email:', companyInfo.getCompanyEmail()],
      ['Company Telephone:', companyInfo.getCompanyTelephone()],
      [''],
      ['Product Inventory Report'],
      ['Exported by:', this.currentUser ? this.currentUser.name : 'Unknown User'], // Add user name here
      ['Exported At:', new Date().toLocaleString()],
      ['Signed by:'],
    ];
    const companyInfoWs: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(companyInfoSheetData);

    // Append sheets to the workbook
    XLSX.utils.book_append_sheet(wb, companyInfoWs, 'Company Info');
    XLSX.utils.book_append_sheet(wb, ws, 'Product Table');

    // Write the workbook to a file
    const currentDate = new Date();
    const excelFileName = `${filename}-${currentDate.toISOString().split('T')[0]}.xlsx`;

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
}
