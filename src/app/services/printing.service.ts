import { Injectable } from '@angular/core';
import { Transactions } from '../models/transaction/transactions';
import {
  companyInfo,
  computeAllTransactionAmount,
  computeByPaymentStatus,
  getImageDataUrl,
  toPHP,
} from '../utils/constants';

import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import {
  PageOrientation,
  TDocumentDefinitions,
  TDocumentInformation,
} from 'pdfmake/interfaces';
import { Users } from '../models/users';
import { TransactionStatus } from '../models/transaction/transaction_status';
import { PaymentStatus } from '../models/transaction/payment';

(<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;

@Injectable({
  providedIn: 'root',
})
export class PrintingService {
  constructor() {}

  async printTransaction(
    title: string,
    transactions: Transactions[],
    users: string
  ) {
    const logoImagePath = 'assets/images/logo.png';
    const logoImageDataURL = await getImageDataUrl(logoImagePath);

    const documentDefinition: TDocumentDefinitions = {
      pageOrientation: 'landscape',
      content: [
        {
          columns: [
            {
              stack: [
                { text: title, bold: true, fontSize: 16 },
                '\n',
                { text: companyInfo.name, bold: true },
                companyInfo.address,
                companyInfo.email,
                companyInfo.telephone,
                '\n',
                { text: `Exported by: ${users}` },
                { text: `Exported At: ${new Date().toLocaleDateString()}` },
                '\n',
              ],
              alignment: 'left',
              margin: [10, 10, 0, 0],
            },
            {
              image: logoImageDataURL,
              width: 50,
              height: 50,
              alignment: 'right',
              margin: [0, 10, 10, 0],
            },
          ],
        },
        '\n', // Adding some space between columns and table
        {
          table: TransactionTable(transactions),
        },
        '\n',

        {
          columns: [
            {
              stack: [
                {
                  text: `Number of Transactions: ${transactions.length}`,
                  bold: true,
                },
                {
                  text: `Unpaid Transactions: ${computeByPaymentStatus(
                    transactions,
                    PaymentStatus.UNPAID
                  )}`,
                  bold: true,
                },
                {
                  text: `Paid Transactions: ${computeByPaymentStatus(
                    transactions,
                    PaymentStatus.PAID
                  )}`,
                  bold: true,
                },
                {
                  text: `Total: ${computeAllTransactionAmount(transactions)}`,
                  bold: true,
                },
                '\n',
              ],
              alignment: 'left',
            },
            {
              width: '*',
              stack: [{ text: 'Signed by: _____________________', bold: true }],
              alignment: 'right',
            },
          ],
        },
      ],
      // pageMargins: [40, 40, 40, 40],
    };

    pdfMake.createPdf(documentDefinition).open();
  }
}

export const TransactionTable = (transactions: Transactions[]) => {
  return {
    headerRows: 1,
    widths: ['auto', '*', 'auto', 'auto', '*', 'auto', 'auto', 'auto'],
    body: [
      [
        '#',
        'Transaction ID',
        'Type',
        'Items',
        'Amount',
        'Payment Status',
        'Order Date',
        'Last Update',
      ],
      ...transactions.map((transaction, index) => [
        index + 1,
        transaction.id,
        transaction.type,
        transaction.orderList.length,
        {
          text: `${toPHP(transaction.payment.amount)} - ${
            transaction.type === 'WALK_IN' ? '' : transaction.payment.type
          }`, // Conditionally hide payment type for WALK_IN transactions
        },
        { text: transaction.payment.status, alignment: 'right' },
        transaction.createdAt.toLocaleDateString(),
        transaction.updatedAt?.toLocaleDateString() ?? '--',
      ]),
    ],
  };
};

export interface TransactionTableData {
  index: number;
  transactionID: string;
  type: string;
  items: string;
  amount: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
