import {
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Transaction, or } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { user } from 'rxfire/auth';
import { Subscription } from 'rxjs';
import { Audit } from 'src/app/models/audit/audit';
import { Products } from 'src/app/models/products';
import { OrderItems } from 'src/app/models/transaction/order_items';
import { TransactionStatus } from 'src/app/models/transaction/transaction_status';
import { TransactionType } from 'src/app/models/transaction/transaction_type';
import { Transactions } from 'src/app/models/transaction/transactions';
import { Users } from 'src/app/models/users';
import { AuditLogService } from 'src/app/services/audit-log.service';
import { AuthService } from 'src/app/services/auth.service';
import { PrintingService } from 'src/app/services/printing.service';
import { TransactionsService } from 'src/app/services/transactions.service';
import { formatTimestamp, getTransactionStatus } from 'src/app/utils/constants';

@Component({
  selector: 'app-product-purchases',
  templateUrl: './product-purchases.component.html',
  styleUrls: ['./product-purchases.component.css'],
})
export class ProductPurchasesComponent implements OnInit, OnDestroy {
  @Input() product!: Products;
  subscription: Subscription;

  _transactionList: Transactions[] = [];
  filteredTransactions$: Transactions[] = [];
  _audits: Audit[] = [];
  users$: Users | null = null;

  searchText = '';
  search() {
    this.filteredTransactions$ = [...this._transactionList];
    this.filteredTransactions$ = this.filteredTransactions$.filter((p) => {
      let input = this.searchText.toLowerCase();

      return p.id.includes(input);
    });
  }
  constructor(
    private transactionService: TransactionsService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private auditService: AuditLogService,
    private router: Router,
    private printingService: PrintingService
  ) {
    authService.users$.subscribe((data) => {
      this.users$ = data;
    });
    this.subscription = new Subscription();
  }
  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
  ngOnInit(): void {
    this.subscription = this.transactionService
      .getAllTransactions()
      .subscribe((data) => {
        console.log('DATA', data);

        this._transactionList = this.filterTransactionsByProductId(
          data,
          this.product.id
        );
        this.filteredTransactions$ = this._transactionList;
        this.cdr.detectChanges();
      });
  }
  filterTransactionsByProductId(
    data: Transactions[],
    productId: string
  ): Transactions[] {
    const uniqueTransactionIds = new Set<string>();
    const filteredTransactions: Transactions[] = [];

    data.forEach((transaction) => {
      const hasDesiredProduct = transaction.orderList.some(
        (order) => order.productID === productId
      );

      if (hasDesiredProduct && !uniqueTransactionIds.has(transaction.id)) {
        filteredTransactions.push(transaction);
        uniqueTransactionIds.add(transaction.id);
      }
    });

    return filteredTransactions;
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

  //printing

  printTransaction(status: number, title: string) {
    const statusValues = Object.values(TransactionStatus);
    let data = this._transactionList.filter(
      (e) => e.status == statusValues[status]
    );
    this.printingService
      .printTransaction(`${title} Transactions`, data, this.users$?.name ?? '')
      .then((data) => console.log('Printing Data'));
  }
  printByType(type: number, title: string) {
    const statusValues = Object.values(TransactionType);
    let data = this._transactionList.filter(
      (e) => e.type == statusValues[type]
    );
    this.printingService
      .printTransaction(`${title} Transactions`, data, this.users$?.name ?? '')
      .then((data) => console.log('Printing Data'));
  }
  navigateToViewTransaction(transactionID: string) {
    let user = this.users$?.type == 'staff' ? 'staff' : 'admin';
    this.router.navigate([user + '/review-transactions/', transactionID]);
  }
}
