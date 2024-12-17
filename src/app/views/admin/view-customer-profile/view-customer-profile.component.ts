import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Customers } from 'src/app/models/customers';
import { TransactionStatus } from 'src/app/models/transaction/transaction_status';
import { Transactions } from 'src/app/models/transaction/transactions';
import { TransactionsService } from 'src/app/services/transactions.service';
import { formatTimestamp } from 'src/app/utils/constants';

import { Location } from '@angular/common';

@Component({
  selector: 'app-view-customer-profile',
  templateUrl: './view-customer-profile.component.html',
  styleUrls: ['./view-customer-profile.component.css'],
})
export class ViewCustomerProfileComponent implements OnInit {
  customer$: Customers | null = null;
  transactions$: Transactions[] = [];
  sortedTransactions: Transactions[] = []; // Store the sorted transactions
  searchText: string = ''; // Property for search text

  constructor(
    private activatedRoute: ActivatedRoute,
    private transactionService: TransactionsService,
    private router: Router,
    public location: Location
  ) {
    this.activatedRoute.queryParams.subscribe((params) => {
      const encodedObject: Customers = (params as Customers) ?? null;
      this.customer$ = encodedObject;
    });
  }

  ngOnInit(): void {
    this.transactionService.transactions$.subscribe((data) => {
      // Store all transactions and filter based on customer ID
      this.transactions$ = data.filter(
        (e) => e.customerID === this.customer$?.id
      );
      // Sort the filtered transactions by createdAt in descending order
      this.sortedTransactions = this.transactions$.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
  }

  search() {
    if (this.searchText === '') {
      // If search text is empty, show all transactions (filtered by customer) in sorted order
      this.sortedTransactions = [...this.transactions$.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )];
    } else {
      // If search text is entered, filter sorted transactions by transaction ID
      this.sortedTransactions = this.transactions$.filter((transaction) => {
        return transaction.id
          .toLowerCase()
          .includes(this.searchText.toLowerCase()); // Filter by transaction ID
      }).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
  }

  convertTimestamp(date: Date): string {
    return formatTimestamp(date); // Assuming formatTimestamp can handle a Date
  }

  countPending() {
    return this.sortedTransactions.filter(
      (data) => data.status === TransactionStatus.PENDING
    ).length;
  }

  countCompleted() {
    return this.sortedTransactions.filter(
      (data) => data.status === TransactionStatus.COMPLETED
    ).length;
  }

  countFailed() {
    return this.sortedTransactions.filter(
      (data) => data.status === TransactionStatus.FAILED
    ).length;
  }

  countCancelled() {
    return this.sortedTransactions.filter(
      (data) => data.status === TransactionStatus.CANCELLED
    ).length;
  }

  countOngoing() {
    return this.sortedTransactions.filter(
      (data) =>
        data.status === TransactionStatus.ACCEPTED ||
        data.status === TransactionStatus.OUT_OF_DELIVERY ||
        data.status === TransactionStatus.READY_TO_DELIVER ||
        data.status === TransactionStatus.READY_TO_PICK_UP
    ).length;
  }

  navigateToViewTransaction(transactionID: string) {
    this.router.navigate([`admin/review-transactions/${transactionID}`]);
  }

  getBackgroundColor(status: TransactionStatus) {
    switch (status) {
      case TransactionStatus.ACCEPTED:
      case TransactionStatus.OUT_OF_DELIVERY:
      case TransactionStatus.READY_TO_DELIVER:
      case TransactionStatus.READY_TO_PICK_UP:
      case TransactionStatus.PENDING:
        return 'yellow'; // ongoing
      case TransactionStatus.FAILED:
      case TransactionStatus.CANCELLED:
        return 'red'; // failed
      case TransactionStatus.COMPLETED:
        return 'green'; // completed
      default:
        return 'gray';
    }
  }

  getTextColor(status: TransactionStatus) {
    switch (status) {
      case TransactionStatus.ACCEPTED:
      case TransactionStatus.OUT_OF_DELIVERY:
      case TransactionStatus.READY_TO_DELIVER:
      case TransactionStatus.READY_TO_PICK_UP:
      case TransactionStatus.PENDING:
        return 'black';
      default:
        return 'white';
    }
  }
}
