import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TransactionStatus } from 'src/app/models/transaction/transaction_status';
import { TransactionType } from 'src/app/models/transaction/transaction_type';
import { Transactions } from 'src/app/models/transaction/transactions';
import { Users } from 'src/app/models/users';
import { AuthService } from 'src/app/services/auth.service';
import { PrintingService } from 'src/app/services/printing.service';
import { TransactionsService } from 'src/app/services/transactions.service';

@Component({
  selector: 'app-admin-transactions',
  templateUrl: './admin-transactions.component.html',
  styleUrls: ['./admin-transactions.component.css'],
})
export class AdminTransactionsComponent implements OnInit, OnDestroy {
  searchText: string = '';
  selectedType: string = ''; // Type filter value
  selectedStatus: string = ''; // Status filter value
  transactions$: Transactions[] = [];
  filteredTransactions$: Transactions[] = []; // Filtered transactions array
  allTransactions$: Transactions[] = [];
  transactionSub$: Subscription;

  startDate: string = ''; // Start date for filtering
  endDate: string = '';   // End date for filtering

  page = 1;
  pageSize = 20;
  collectionSize = 0;
  users$: Users | null = null;

  constructor(
    private transactionService: TransactionsService,
    private authService: AuthService,
    private printingService: PrintingService,
    private router: Router
  ) {
    this.transactionSub$ = new Subscription();
    authService.users$.subscribe((data) => {
      this.users$ = data;
    });
  }

  ngOnInit(): void {
    this.transactionSub$ = this.transactionService.transactions$.subscribe(
      (data) => {
        this.allTransactions$ = data.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.filteredTransactions$ = [...this.allTransactions$];
        this.collectionSize = this.filteredTransactions$.length;
        this.refreshTransactions();
      }
    );
  }

  ngOnDestroy(): void {
    this.transactionSub$.unsubscribe();
  }

  search() {
    console.log("searchText:", this.searchText);
    console.log("selectedType:", this.selectedType);
    console.log("selectedStatus:", this.selectedStatus);
    console.log("startDate:", this.startDate);
    console.log("endDate:", this.endDate);

    // Ensure startDate and endDate are at the start and end of the selected day
    const adjustedStartDate = this.startDate ? new Date(this.startDate + 'T00:00:00') : null;
    const adjustedEndDate = this.endDate ? new Date(this.endDate + 'T23:59:59') : null;

    this.filteredTransactions$ = this.allTransactions$.filter((transaction) => {
      const matchesText = transaction.id.toLowerCase().includes(this.searchText.toLowerCase());
      const matchesType = this.selectedType ? transaction.type === this.selectedType : true;
      const matchesStatus = this.selectedStatus ? transaction.status === this.selectedStatus : true;

      const transactionDate = new Date(transaction.createdAt);
      const matchesStartDate = adjustedStartDate ? transactionDate >= adjustedStartDate : true;
      const matchesEndDate = adjustedEndDate ? transactionDate <= adjustedEndDate : true;

      console.log(`Filtering transaction ${transaction.id}:`, matchesText, matchesType, matchesStatus, matchesStartDate, matchesEndDate);

      return matchesText && matchesType && matchesStatus && matchesStartDate && matchesEndDate;
    });

    this.page = 1;
    this.refreshTransactions();
  }

  refreshTransactions() {
    this.transactions$ = this.filteredTransactions$.slice(
      (this.page - 1) * this.pageSize,
      (this.page - 1) * this.pageSize + this.pageSize
    );
    this.collectionSize = this.filteredTransactions$.length;
  }

  getBackgroundColor(status: TransactionStatus) {
    switch (status) {
      case TransactionStatus.ACCEPTED:
      case TransactionStatus.OUT_OF_DELIVERY:
      case TransactionStatus.READY_TO_DELIVER:
      case TransactionStatus.READY_TO_PICK_UP:
      case TransactionStatus.PENDING:
        return 'yellow';
      case TransactionStatus.FAILED:
      case TransactionStatus.CANCELLED:
        return 'red';
      case TransactionStatus.COMPLETED:
        return 'green';
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

  navigateToViewTransaction(transactionID: string) {
    let user = this.users$?.type == 'staff' ? 'staff' : 'admin';
    this.router.navigate([user + '/review-transactions/', transactionID]);
  }

  printTransaction(status: number, title: string) {
    const statusValues = Object.values(TransactionStatus);
    let data = this.filteredTransactions$.filter(
      (e) => e.status == statusValues[status]
    );
    this.printingService
      .printTransaction(`${title} Transactions`, data, this.users$?.name ?? 'Unknown')
      .then((data) => console.log('Printing Data'));
  }

  printByType(type: number, title: string) {
    const statusValues = Object.values(TransactionType);
    let data = this.filteredTransactions$.filter(
      (e) => e.type == statusValues[type]
    );
    this.printingService
      .printTransaction(`${title} Transactions`, data, this.users$?.name ?? 'Unknown')
      .then((data) => console.log('Printing Data'));
  }

  generateReport() {
    const reportTitle = `Transaction Report - ${this.selectedType ? `${this.selectedType}` : 'All Types'} - ${this.selectedStatus ? `${this.selectedStatus}` : 'All Statuses'}`;
    this.printingService
      .printTransaction(
        reportTitle,
        this.filteredTransactions$,
        this.users$?.name ?? 'Unknown'
      )
      .then((data) => console.log('Report Generated:', data))
      .catch((error) => console.error('Error generating report:', error));
  }
}
