import { Injectable } from '@angular/core';
import { CompanyInfoService } from '../company-info/company-info.service';
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root',
})
export class ExcelExportService {
  // Helper method to convert timestamp to a string
  static convertTimestamp(timestamp: any): string {
    return timestamp.toDate().toLocaleString();
  }

  // Helper method to calculate total quantity sold
  static calculateTotalQuantitySold(data: any[]): number {
    return data.reduce((total, element) => total + (element.quantity || 0), 0);
  }

  // Helper method to calculate total sales
  static calculateTotalSales(data: any[]): number {
    return data.reduce((total, element) => total + element.orderValue, 0);
  }

  // Helper method to get the top N most or least sold products
  static getTopSoldProducts(
    data: any[],
    isMostSold: boolean,
    count: number
  ): string {
    const productSoldMap: { [key: string]: number } = {};

    data.forEach((element) => {
      const productName = element.productName || 'Unknown Product';
      productSoldMap[productName] =
        (productSoldMap[productName] || 0) + (element.quantity || 0);
    });

    const sortedProducts = Object.keys(productSoldMap)
      .sort((a, b) =>
        isMostSold
          ? productSoldMap[b] - productSoldMap[a]
          : productSoldMap[a] - productSoldMap[b]
      )
      .slice(0, count);

    const result = sortedProducts
      .map(
        (productName, index) =>
          `${index + 1}. ${productName} - ${productSoldMap[productName]}`
      )
      .join('\n');

    return result || `No Product Sold (${isMostSold ? 'Most' : 'Least'} Sold)`;
  }

  // Main method to export data to Excel
  static exportToExcel(
    data: any[],
    filename: string,
    cashierName: string,
    companyInfo: CompanyInfoService
  ) {
    // Transform data for Excel format
    const transformedData = data.flatMap((transaction) =>
      transaction.orderList.map((order: any) => ({
        invoiceId: transaction.id || '---',
        customerName: transaction.customerName || '---',
        productName: order.productName || '---',
        quantity: order.quantity || '---',
        orderValue:
          order.quantity !== undefined && order.price !== undefined
            ? order.quantity * order.price
            : '---',
        timestamp: transaction.createdAt
          ? ExcelExportService.convertTimestamp(transaction.createdAt)
          : '---',
      }))
    );

    // Create workbook and sheets
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(transformedData);
    const companyInfoWs: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([
      ['Company Name', companyInfo.getCompanyName()],
      ['Company Address', companyInfo.getCompanyAddress()],
      ['Company Email', companyInfo.getCompanyEmail()],
      ['Company Telephone', companyInfo.getCompanyTelephone()],
      ['Printed by', cashierName],
      ['Printed At', new Date().toLocaleString()],
      ['Signed by:'],
    ]);
    const summaryWs: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet([
      ['Number of Transactions', transformedData.length],
      [
        'Total Product Sold',
        ExcelExportService.calculateTotalQuantitySold(transformedData),
      ],
      ['Total Sales', ExcelExportService.calculateTotalSales(transformedData)],
      [
        'Top 3 Most Sold Products',
        ExcelExportService.getTopSoldProducts(transformedData, true, 3),
      ],
      [
        'Top 3 Least Sold Products',
        ExcelExportService.getTopSoldProducts(transformedData, false, 3),
      ],
    ]);

    // Append sheets to the workbook
    XLSX.utils.book_append_sheet(wb, companyInfoWs, 'Company Info');
    XLSX.utils.book_append_sheet(wb, ws, 'Transaction Data');
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // Write the workbook to a file
    const currentDate = new Date();
    XLSX.writeFile(
      wb,
      `${filename} - ${currentDate.toLocaleString().replace(/\//g, '-')}.xlsx`
    );
  }
}
