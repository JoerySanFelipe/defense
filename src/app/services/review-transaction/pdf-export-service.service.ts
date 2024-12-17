import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { Transactions } from 'src/app/models/transaction/transactions';
import * as pdfMake from 'pdfmake/build/pdfmake';

@Injectable({
  providedIn: 'root',
})
export class PdfExportService {
  constructor(private location: Location) {}

  async exportTransactionAsPdf(transaction: Transactions) {
    const documentDefinition = await this.getDocumentDefinition(transaction);
    this.createAndDownloadPdf(documentDefinition);
  }

  private async getDocumentDefinition(transaction: Transactions) {
    const logoImagePath = '../../../../assets/images/logo.png';
    const logoImageDataURL = await this.getImageDataUrl(logoImagePath);

    // const imageUrl = await this.getImageDataUrl(transaction.orderList?.[0]?.imageUrl);

    const content = [
      { image: logoImageDataURL, width: 100, alignment: 'center' },
      { text: 'Review Transaction', style: 'title', alignment: 'center' },
      '\n',
      { text: `Order ID: ${transaction.id}`, style: 'header' },
      { text: `Type: ${transaction.type}`, style: 'header' },
      { text: `Status: ${transaction.status}`, style: 'header' },
      '\n',
      { text: 'Delivery Information', style: 'subheader' },
      { text: `Receiver: ${transaction.address?.contact?.name ?? '---'}` },
      { text: `Phone: ${transaction.address?.contact?.phone ?? '---'}` },
      { text: `Address: ${this.displayAddress(transaction.address!)}` },
      '\n',
      { text: 'Payment Information', style: 'subheader' },
      {
        text: `Confirmed by: ${
          transaction.payment?.details?.confirmedBy ?? '---'
        }`,
      },
      { text: `Payment Method: ${transaction.payment?.type}` },
      { text: `Status: ${transaction.payment?.status}` },
      { text: `Amount: ${transaction.payment?.amount}` },
      {
        text: `Amount Received: ${
          transaction.payment?.details?.cashReceive ?? 0
        }`,
      },
      { text: `Date: ----` },
      '\n',
      { text: 'Product Information', style: 'subheader' },
      // { image: imageUrl, width: 100 },
      { text: `ID: ${transaction.orderList?.[0]?.productID}` },
      { text: `Name: ${transaction.orderList?.[0]?.productName}` },
      { text: `Price: ${transaction.orderList?.[0]?.price}` },
      { text: `Quantity: ${transaction.orderList?.[0]?.quantity}` },
      {
        text: `Shipping Fee: ${transaction.orderList?.[0]?.shippingInfo?.shipping}`,
      },
      { text: `Total: ${transaction.payment?.amount}` },
    ];

    const styles = {
      title: { fontSize: 18, bold: true, alignment: 'center', margin: [0, 10] },
      header: { fontSize: 14, bold: true, margin: [0, 5] },
      subheader: { fontSize: 12, bold: true, margin: [0, 5] },
    };

    return {
      content: content,
      styles: styles,
    };
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

  private createAndDownloadPdf(documentDefinition: any) {
    pdfMake
      .createPdf(documentDefinition)
      .download(`review_transaction_report.pdf`);
  }

  private displayAddress(address: any): string {
    if (address === undefined || address === null) {
      return '----';
    }
    return `${address.landmark ?? ''}, ${address.barangay}, ${address.city}, ${
      address.province
    }, ${address.region} | ${address.postalCode}`;
  }

  private formatPaymentDate(date: string | undefined): string {
    if (!date) return '';
    return date;
  }
}
