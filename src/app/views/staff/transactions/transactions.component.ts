// Import statements
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Timestamp } from '@angular/fire/firestore';

import { AuthService } from 'src/app/services/auth.service';
import { TransactionsService } from 'src/app/services/transactions.service';
import { SearchService } from 'src/app/services/search.service';
import { Transactions } from 'src/app/models/transaction/transactions';
import { Users } from 'src/app/models/users';
import { OrderItems } from 'src/app/models/transaction/order_items';
import {
  formatTimestamp,
  getTransactionStatus,
  startOfDay,
} from 'src/app/utils/constants';

import { CompanyInfoService } from 'src/app/services/reportgen/company-info/company-info.service';
import { ExcelExportService } from 'src/app/services/reportgen/transactions/excel-export.service';
import { PdfExportService } from 'src/app/services/reportgen/transactions/pdf-export.service';
import { PrintingService } from 'src/app/services/printing.service';
import { TransactionStatus } from 'src/app/models/transaction/transaction_status';
import { TransactionType } from 'src/app/models/transaction/transaction_type';

// Component decorator with metadata
@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.css'],
})
export class TransactionsComponent implements OnInit {
  // Class properties
  _users: Users | null = null;
  _transactionList: Transactions[] = [];
  searchQuery: string = '';
  dataSource: Transactions[] = [];
  recentTransactions: Transactions[] = [];
  private readonly defaultExportFileName: string = 'Transactions_report';

  // Constructor for dependency injection
  constructor(
    private transactionService: TransactionsService,
    private authService: AuthService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private searchService: SearchService,
    private companyInfoService: CompanyInfoService,
    private printingService: PrintingService,
    private excelService: ExcelExportService,
    private pdfService: PdfExportService,
    public location: Location
  ) {
    authService.users$.subscribe((data) => {
      this._users = data;
    });
  }

  // Lifecycle hook - ngOnInit
  ngOnInit(): void {
    this.transactionService.transactions$.subscribe((data) => {
      this.dataSource = data;
      this.recentTransactions = data.filter(
        (e) =>
          e.createdAt >= startOfDay(new Date()) &&
          e.cashierID == this._users?.id
      );
    });
    //Added
    this.transactionService.getAllTransactions().subscribe((transactions) => {
      this._transactionList = transactions.filter(
        (e) => e.cashierID == this._users?.id
      );
      this.applyFilter();
    });
  }
  applyFilter(): void {
    if (!this.searchQuery.trim()) {
      // If search query is empty, display all transactions
      this.dataSource = this._transactionList;
    } else {
      // Filter transactions based on search query
      const lowerCaseQuery = this.searchQuery.toLowerCase();
      this.dataSource = this._transactionList.filter(
        (transaction) =>
          transaction.id.includes(lowerCaseQuery) ||
          transaction.orderList.some((orderItem) =>
            orderItem.productName.toLowerCase().includes(lowerCaseQuery)
          )
      );
    }
  }
  //END

  private filterTransactions(query: string): void {
    if (!query.trim()) {
      this.dataSource = this._transactionList;
    } else {
      const filteredData = this._transactionList.filter((transaction) => {
        const lowerCaseQuery = query.toLowerCase();

        return (
          transaction.id.includes(lowerCaseQuery) ||
          transaction.cashierID.includes(lowerCaseQuery) ||
          transaction.customerID.includes(lowerCaseQuery) ||
          this.checkOrderListForQuery(transaction.orderList, lowerCaseQuery) ||
          transaction.orderList.some((orderItem) =>
            orderItem.productName.toLowerCase().includes(lowerCaseQuery)
          ) ||
          transaction.orderList.some((orderItem) =>
            orderItem.quantity.toString().includes(lowerCaseQuery)
          ) ||
          transaction.orderList.some((orderItem) =>
            orderItem.quantity.toString().includes(lowerCaseQuery)
          ) ||
          this.convertTimestamp(transaction.createdAt)
            .toLowerCase()
            .includes(lowerCaseQuery)
        );
      });
      this.dataSource = filteredData;
    }
    this.recentTransactions = this.getTransactionsMadeToday();
  }

  // Public method to calculate total sales
  calculateTotalSales(transactions: Transactions[]): number {
    return transactions.reduce((total, transaction) => {
      return total + this.calculateTotalOrderValue(transaction.orderList);
    }, 0);
  }

  calculateTotalOrderValue(orderList: OrderItems[]): number {
    return orderList.reduce((total, orderItem) => {
      return total + (orderItem.price || 0) * (orderItem.quantity || 0);
    }, 0);
  }

  private checkOrderListForQuery(
    orderList: OrderItems[],
    query: string
  ): boolean {
    return orderList.some((orderItem) => orderItem.productName.includes(query));
  }

  getCurrentDate(): Date {
    return new Date();
  }

  // Public method to convert timestamp to a formatted string
  convertTimestamp(timestamp: Date): string {
    return formatTimestamp(timestamp);
  }

  // Public method to filter transactions based on transaction status type
  getTransactionByStatus(type: number): Transactions[] {
    return this._transactionList.filter(
      (e) => e.status == getTransactionStatus(type)
    );
  }

  // Public method to filter transactions made today
  getTransactionsMadeToday(): Transactions[] {
    const currentDate = new Date();
    return this._transactionList.filter((transaction) => {
      const transactionDate = transaction.createdAt;

      return (
        transactionDate.getDate() === currentDate.getDate() &&
        transactionDate.getMonth() === currentDate.getMonth() &&
        transactionDate.getFullYear() === currentDate.getFullYear()
      );
    });
  }

  // Public method to export transactions to Excel
  exportToExcel(): void {
    const cashierName = this._users ? this._users.name : 'Unknown Cashier';
    const companyInfo = this.companyInfoService;
    ExcelExportService.exportToExcel(
      this.dataSource,
      'transactions-report',
      cashierName,
      companyInfo
    );
  }

  // Public method to export transactions to PDF
  exportToPdf(): void {
    const companyInfo = this.companyInfoService;

    this.pdfService.exportToPdf({
      data: this.dataSource,
      filename: 'transactions-report',
      companyInfo: companyInfo,
      cashierName: this._users?.name ?? 'Unknown Cashier',
    });
  }

  printTransaction(status: number, title: string) {
    const statusValues = Object.values(TransactionStatus);
    let data = this._transactionList.filter(
      (e) => e.status == statusValues[status]
    );
    this.printingService
      .printTransaction(`${title} Transactions`, data, this._users?.name ?? '')
      .then((data) => console.log('Printing Data'));
  }

  printByType(type: number, title: string) {
    const statusValues = Object.values(TransactionType);
    let data = this._transactionList.filter(
      (e) => e.type == statusValues[type]
    );
    this.printingService
      .printTransaction(`${title} Transactions`, data, this._users?.name ?? '')
      .then((data) => console.log('Printing Data'));
  }

  navigateToViewTransaction(transactionID: string) {
    let user = this._users?.type == 'staff' ? 'staff' : 'admin';
    this.router.navigate([user + '/review-transactions/', transactionID]);
  }
}
