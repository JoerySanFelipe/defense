import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';
import { NavigationExtras, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import {
  Payment,
  PaymentDetails,
  PaymentStatus,
} from 'src/app/models/transaction/payment';
import { TrasactionDetails } from 'src/app/models/transaction/transaction_details';
import * as bootstrap from 'bootstrap';
import { TransactionStatus } from 'src/app/models/transaction/transaction_status';
import { TransactionType } from 'src/app/models/transaction/transaction_type';
import { Transactions } from 'src/app/models/transaction/transactions';
import { Users } from 'src/app/models/users';
import { AuthService } from 'src/app/services/auth.service';
import { LoadingService } from 'src/app/services/loading.service';
import { ProductService } from 'src/app/services/product.service';
import { TransactionsService } from 'src/app/services/transactions.service';
import {
  endOfDay,
  formatPrice,
  formatTimestamp,
  generateTransactionDetails,
  getTransactionStatus,
  getTransactionType,
  startOfDay,
} from 'src/app/utils/constants';
import { AuditLogService } from 'src/app/services/audit-log.service';
import { UserType } from 'src/app/models/user-type';
import { ActionType, ComponentType } from 'src/app/models/audit/audit_type';
import { TransactionCalculator } from 'src/app/utils/transaction_calc';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AddDriverComponent } from 'src/app/components/add-driver/add-driver.component';
import { AddPaymentComponent } from 'src/app/components/add-payment/add-payment.component';
import { DeclineDialogComponent } from 'src/app/components/decline-dialog/decline-dialog.component';
import { user } from 'rxfire/auth';
import { Observable, map, shareReplay } from 'rxjs';
import { PrintingService } from 'src/app/services/printing.service';
declare var window: any;
declare var window2: any;
@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css'],
})
export class OrdersComponent implements OnInit {
  _transactionList: Transactions[] = [];
  private _users: Users | null = null;

  transactionCalculator: TransactionCalculator;
  pending$: Observable<Transactions[]> | undefined;
  accepted$: Observable<Transactions[]> | undefined;
  toDeliver$: Observable<Transactions[]> | undefined;
  toPick$: Observable<Transactions[]> | undefined;
  outOfDelivery$: Observable<Transactions[]> | undefined;
  failed$: Observable<Transactions[]> | undefined;
  completed$: Observable<Transactions[]> | undefined;
  shared$: Observable<Transactions[]> | undefined;

  searchText: string = '';
  search(table: 'F' | 'C') {
    if (table === 'F') {
      this.failed$ = this.failed$?.pipe(
        map((t) =>
          t.filter((e) => {
            return e.id.toLowerCase().includes(this.searchText.toLowerCase());
          })
        )
      );
    } else if (table === 'C') {
      this.completed$ = this.completed$?.pipe(
        map((t) =>
          t.filter((e) => {
            return e.id.toLowerCase().includes(this.searchText.toLowerCase());
          })
        )
      );
    }
  }
  constructor(
    private transactionService: TransactionsService,
    public loadingService: LoadingService,
    private toastrService: ToastrService,
    private authService: AuthService,
    private productService: ProductService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private auditService: AuditLogService,
    private printingService: PrintingService
  ) {
    this.transactionCalculator = new TransactionCalculator([]);
    authService.users$.subscribe((data) => {
      this._users = data;
    });
  }
  private modalService = inject(NgbModal);

  ngOnInit(): void {
    this.shared$ = this.transactionService.transactions$.pipe(shareReplay(1));

    this.pending$ = this.filterTransactions(
      this.shared$,
      TransactionStatus.PENDING
    );
    this.accepted$ = this.filterTransactions(
      this.shared$,
      TransactionStatus.ACCEPTED
    );
    this.toDeliver$ = this.filterTransactions(
      this.shared$,
      TransactionStatus.READY_TO_DELIVER
    );
    this.toPick$ = this.filterTransactions(
      this.shared$,
      TransactionStatus.READY_TO_PICK_UP
    );
    this.outOfDelivery$ = this.filterTransactions(
      this.shared$,
      TransactionStatus.OUT_OF_DELIVERY
    );
    this.failed$ = this.filterTransactions(
      this.shared$,
      TransactionStatus.FAILED
    );
    this.completed$ = this.filterTransactions(
      this.shared$,
      TransactionStatus.COMPLETED
    );
  }

  get pendingOrdersLastSevenDays(): Observable<number> | undefined {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const start = startOfDay(lastWeek);
    const end = endOfDay(new Date());

    return this.pending$?.pipe(
      map(
        (transactions) =>
          transactions.filter(
            (transaction) =>
              (transaction.createdAt >= start &&
                transaction.createdAt <= end) ||
              (transaction.updatedAt &&
                transaction.updatedAt >= start &&
                transaction.updatedAt <= end)
          ).length
      )
    );
  }

  get acceptedLastSevenDays(): Observable<number> | undefined {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const start = startOfDay(lastWeek);
    const end = endOfDay(new Date());

    return this.accepted$?.pipe(
      map(
        (transactions) =>
          transactions.filter(
            (transaction) =>
              (transaction.createdAt >= start &&
                transaction.createdAt <= end) ||
              (transaction.updatedAt &&
                transaction.updatedAt >= start &&
                transaction.updatedAt <= end)
          ).length
      )
    );
  }

  get completedLastSevenDays(): Observable<number> | undefined {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const start = startOfDay(lastWeek);
    const end = endOfDay(new Date());

    return this.completed$?.pipe(
      map(
        (transactions) =>
          transactions.filter(
            (transaction) =>
              (transaction.createdAt >= start &&
                transaction.createdAt <= end) ||
              (transaction.updatedAt &&
                transaction.updatedAt >= start &&
                transaction.updatedAt <= end)
          ).length
      )
    );
  }

  get salesLastSevenDays(): Observable<number> | undefined {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const start = startOfDay(lastWeek);
    const end = endOfDay(new Date());

    return this.shared$?.pipe(
      map((transactions) => {
        let filteredData = transactions.filter(
          (transaction) =>
            // Check if created or updated within the last 7 days
            (transaction.createdAt >= start && transaction.createdAt <= end) ||
            (transaction.updatedAt && transaction.updatedAt >= start && transaction.updatedAt <= end)
        );

        let total = 0;
        filteredData.forEach((transaction) => {
          // Ensure that only COMPLETED transactions are considered
          if (transaction.status === TransactionStatus.COMPLETED) {
            // Safely add the payment amount if it's valid
            const amount = transaction.payment?.amount;
            if (amount && !isNaN(amount)) {
              total += amount;
            }
          }
        });

        return total;
      })
    );
}


  get pickUpLastSevenDays(): Observable<number> | undefined {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const start = startOfDay(lastWeek);
    const end = endOfDay(new Date());

    return this.shared$?.pipe(
      map((transactions) => 
        transactions.filter(
          (transaction) =>
            transaction.type === TransactionType.PICK_UP && 
            // Filter for PICK_UP type within the last 7 days based on creation or update
            ((transaction.createdAt >= start && transaction.createdAt <= end) ||
             (transaction.updatedAt && transaction.updatedAt >= start && transaction.updatedAt <= end))
        ).length
      )
    );
}

get deliveryLastSevenDays(): Observable<number> | undefined {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const start = startOfDay(lastWeek);
    const end = endOfDay(new Date());

    return this.shared$?.pipe(
      map((transactions) => 
        transactions.filter(
          (transaction) =>
            transaction.type === TransactionType.DELIVERY &&
            // Filter for DELIVERY type within the last 7 days based on creation or update
            ((transaction.createdAt >= start && transaction.createdAt <= end) ||
             (transaction.updatedAt && transaction.updatedAt >= start && transaction.updatedAt <= end))
        ).length
      )
    );
}


  get failedLastSevenDays(): Observable<number> | undefined {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const start = startOfDay(lastWeek);
    const end = endOfDay(new Date());

    return this.failed$?.pipe(
      map(
        (transactions) =>
          transactions.filter(
            (transaction) =>
              (transaction.createdAt >= start &&
                transaction.createdAt <= end) ||
              (transaction.updatedAt &&
                transaction.updatedAt >= start &&
                transaction.updatedAt <= end)
          ).length
      )
    );
  }
  applyTodayFilter(table: 'F' | 'C') {
    const start = startOfDay(new Date());
    const end = endOfDay(new Date());
    console.log('Today Filter');
    if (table === 'F') {
      this.failed$ = this.failed$?.pipe(
        map((transactions) =>
          transactions.filter((transaction) => {
            const createdAtValid =
              transaction.createdAt >= start && transaction.createdAt <= end;
            const updatedAtValid =
              transaction.updatedAt !== undefined &&
              transaction.updatedAt >= start &&
              transaction.updatedAt <= end;
            if (createdAtValid || updatedAtValid) {
              console.log(transaction);
            }
            return createdAtValid || updatedAtValid;
          })
        )
      );
    } else if (table === 'C') {
      this.completed$ = this.completed$?.pipe(
        map((transactions) =>
          transactions.filter((transaction) => {
            console.log(transaction.updatedAt);
            const createdAtValid =
              transaction.createdAt >= start && transaction.createdAt <= end;
            const updatedAtValid =
              transaction.updatedAt !== undefined &&
              transaction.updatedAt >= start &&
              transaction.updatedAt <= end;

            return createdAtValid || updatedAtValid;
          })
        )
      );
    }
  }

  applyAllOrdersFilter(table: 'F' | 'C') {
    if (this.shared$ !== undefined) {
      if (table === 'F') {
        this.failed$ = this.filterTransactions(
          this.shared$,
          TransactionStatus.FAILED
        );
      } else if (table === 'C') {
        this.completed$ = this.filterTransactions(
          this.shared$,
          TransactionStatus.COMPLETED
        );
      }
    }
  }
  private filterTransactions(
    transactions$: Observable<Transactions[]>,
    status: TransactionStatus
  ): Observable<Transactions[]> {
    return transactions$.pipe(
      map((transactions) =>
        transactions.filter((transaction) => transaction.status === status)
      )
    );
  }
  selectTransactionToAddPayment(transaction: Transactions) {
    const modal = this.modalService.open(AddPaymentComponent);
    modal.componentInstance.transaction = transaction;
    modal.result
      .then((data: any) => {
        let transaction = data as Transactions;
        this.addPayment(transaction.payment, transaction.id);
      })
      .catch((err) => {
        this.toastrService.error(err.toString());
      });
  }

  openLinkInNewTab(link: string): void {
    window.open(link, '_blank');
  }
  addDriver(transaction: Transactions) {
    const modal = this.modalService.open(AddDriverComponent);
    modal.result
      .then((data: Users) => {
        this.isDriverSelected(data, transaction.id);
      })
      .catch((err) => this.toastrService.error(err.toString()));
  }

  convertTimestamp(timestamp: Date) {
    return formatTimestamp(timestamp);
  }

  declineTransaction(transactions: Transactions) {
    const modal = this.modalService.open(DeclineDialogComponent);
    modal.componentInstance.transaction = transactions;
    modal.result.then((data: string) => {
      if (typeof data === 'string' && data !== '') {
        this.declineOrder(transactions.id, data);
      }
    });
  }

  acceptOrder(
    transaction: Transactions,
    transactionID: string,
    payment: Payment
  ) {
    this.loadingService.showLoading(transactionID);
    this.transactionService
      .acceptTransaction(
        this._users?.id ?? '',
        transactionID,
        TransactionStatus.ACCEPTED,
        generateTransactionDetails(transaction.id, TransactionStatus.ACCEPTED),
        payment
      )
      .then(async (value) => {
        await this.auditService.createAudit({
          id: '',
          email: this._users?.email ?? '',
          role: this._users?.type ?? UserType.ADMIN,
          action: ActionType.UPDATE,
          component: ComponentType.TRANSACTION,
          payload: {
            message: `order is accepted by ${this._users?.name}`,
            transactionID: transactionID,
            transactionStatus: TransactionStatus.ACCEPTED,
            details: generateTransactionDetails(
              transaction.id,
              TransactionStatus.ACCEPTED
            ),
          },
          details: 'accepting order',
          timestamp: new Date(),
        });
        this.toastrService.success('Order is accepted!');
      })
      .catch((err) => this.toastrService.error(err.message))
      .finally(async () => {
        await this.productService.batchUpdateProductQuantity(
          transaction.orderList
        );
        this.loadingService.hideLoading(transactionID);
      });
  }

  declineOrder(transactionID: string, reason: string) {
    this.loadingService.showLoading(transactionID);
    this.transactionService
      .declineTransaction(transactionID, reason, this._users?.name ?? '')
      .then(async (value) => {
        this.toastrService.success('Order is has been decline!');
        await this.auditService.createAudit({
          id: '',
          email: this._users?.email ?? '',
          role: this._users?.type ?? UserType.ADMIN,
          action: ActionType.UPDATE,
          component: ComponentType.TRANSACTION,
          payload: {
            message: 'Order is decline',
            user: this._users?.name,
            userId: this._users?.id,
            transactionID: transactionID,
          },
          details: 'declining order',
          timestamp: new Date(),
        });
      })
      .catch((err) => this.toastrService.error(err.message))
      .finally(() => this.loadingService.hideLoading(transactionID));
  }
  readyToDeliver(transactionID: string, payment: Payment) {
    this.transactionService
      .updateTransactionStatus(
        transactionID,
        TransactionStatus.READY_TO_DELIVER,
        generateTransactionDetails(
          transactionID,
          TransactionStatus.READY_TO_DELIVER
        ),
        payment
      )
      .then(async (value) => {
        await this.auditService.createAudit({
          id: '',
          email: this._users?.email ?? '',
          role: this._users?.type ?? UserType.ADMIN,
          action: ActionType.UPDATE,
          component: ComponentType.TRANSACTION,
          payload: {
            message: 'Transaction updated to ready to deliver',
            transactionID: transactionID,
            transactionStatus: TransactionStatus.READY_TO_DELIVER,
            details: generateTransactionDetails(
              transactionID,
              TransactionStatus.READY_TO_DELIVER
            ),
          },
          details: 'updating order to be deliver',
          timestamp: new Date(),
        });
        this.toastrService.success('Order is ready to deliver!');
      })
      .catch((err) => this.toastrService.error(err.message));
  }

  readyToPickUp(transactionID: string, payment: Payment) {
    this.transactionService
      .updateTransactionStatus(
        transactionID,
        TransactionStatus.READY_TO_PICK_UP,
        generateTransactionDetails(
          transactionID,
          TransactionStatus.READY_TO_PICK_UP
        ),
        payment
      )
      .then(async (value) => {
        await this.auditService.createAudit({
          id: '',
          email: this._users?.email ?? '',
          role: this._users?.type ?? UserType.ADMIN,
          action: ActionType.UPDATE,
          component: ComponentType.TRANSACTION,
          payload: {
            message: 'Transaction Updated to ready to pick up',
            transactionID: transactionID,
            transactionStatus: TransactionStatus.READY_TO_PICK_UP,
            details: generateTransactionDetails(
              transactionID,
              TransactionStatus.READY_TO_PICK_UP
            ),
          },
          details: 'updating order to be pick up',
          timestamp: new Date(),
        });
        this.toastrService.success('Order is ready to pick up!');
      })
      .catch((err) => this.toastrService.error(err.message));
  }

  markAsComplete(transaction: Transactions, payment: Payment) {
    this.transactionService
      .updateTransactionStatus(
        transaction.id,
        TransactionStatus.COMPLETED,
        generateTransactionDetails(transaction.id, TransactionStatus.COMPLETED),
        payment
      )
      .then(async (value) => {
        await this.auditService.createAudit({
          id: '',
          email: this._users?.email ?? '',
          role: this._users?.type ?? UserType.ADMIN,
          action: ActionType.UPDATE,
          component: ComponentType.TRANSACTION,
          payload: {
            message: `Transaction Completed`,
            transactionID: transaction.id,
            transactionStatus: TransactionStatus.COMPLETED,
            details: generateTransactionDetails(
              transaction.id,
              TransactionStatus.COMPLETED
            ),
          },
          details: 'updating order complete',
          timestamp: new Date(),
        });
        this.toastrService.success('Order completed!');
      })
      .catch((err) => this.toastrService.error(err.message));
  }

  getTrasactionByStatus(type: number) {
    this._transactionList = this._transactionList.filter(
      (e) => e.status == getTransactionStatus(type)
    );
  }

  ongoingDeliver(transactionID: string, payment: Payment) {
    this.transactionService
      .updateTransactionStatus(
        transactionID,
        TransactionStatus.OUT_OF_DELIVERY,
        generateTransactionDetails(
          transactionID,
          TransactionStatus.OUT_OF_DELIVERY
        ),
        payment
      )
      .then(async (value) => {
        await this.auditService.createAudit({
          id: '',
          email: this._users?.email ?? '',
          role: this._users?.type ?? UserType.ADMIN,
          action: ActionType.UPDATE,
          component: ComponentType.TRANSACTION,
          payload: {
            message: `Update Transaction to delivery`,
            transactionID: transactionID,
            transactionStatus: TransactionStatus.OUT_OF_DELIVERY,
            details: generateTransactionDetails(
              transactionID,
              TransactionStatus.OUT_OF_DELIVERY
            ),
          },
          details: 'updating order out for delivery',
          timestamp: new Date(),
        });
        this.toastrService.success('Order is out for delivery!');
      })
      .catch((err) => this.toastrService.error(err.message));
  }
  reviewTransaction(transaction: Transactions) {
    let user = this._users?.type == 'staff' ? 'staff' : 'admin';
    this.router.navigate([user + '/review-transactions/', transaction.id]);
  }

  isPaid(payment: Payment): boolean {
    if (payment.status == PaymentStatus.PAID) {
      return true;
    }
    return false;
  }
  isDriverSelected(user: Users, transactionID: string) {
    this.transactionService
      .addDriver(transactionID, user.id)
      .then(async () => {
        await this.auditService.createAudit({
          id: '',
          email: this._users?.email ?? '',
          role: this._users?.type ?? UserType.ADMIN,
          action: ActionType.UPDATE,
          component: ComponentType.TRANSACTION,
          payload: {
            message: `Driver Added by ${this._users?.name}`,
            transactionID: transactionID,
            user: user.name,
            email: user.email,
            phone: user.phone,
          },
          details: 'adding driver',

          timestamp: new Date(),
        });
        this.toastrService.success(`${user.name} is selected`);
      })
      .catch((err) => this.toastrService.success(err.toString()));
  }

  addPayment(payment: Payment, transactionID: string) {
    this.transactionService
      .addPayment(transactionID, payment)
      .then(async () => {
        await this.auditService.createAudit({
          id: '',
          email: this._users?.email ?? '',
          role: this._users?.type ?? UserType.ADMIN,
          action: ActionType.UPDATE,
          component: ComponentType.TRANSACTION,
          payload: {
            message: `Payment Confirmed by ${this._users?.name}`,
            user: this._users?.name,
            userId: this._users?.id,
            invoiceId: transactionID,
            data: payment,
          },
          details: 'Adding payment to transaction',
          timestamp: new Date(),
        });
        this.toastrService.success('payment success');
      })
      .catch((err) => this.toastrService.error(err.message));
  }

  formatPHP(num: number) {
    return formatPrice(num);
  }

  //added
  private isWithinLastSevenDays(timestamp: any): boolean {
    if (!(timestamp instanceof Date)) {
      return false; // If timestamp is not a Date object, return false
    }

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return timestamp.getTime() >= oneWeekAgo;
  }

  //pending orders
  calculatePendingOrders(): number {
    const pendingTransactions = this._transactionList.filter(
      (transaction) =>
        transaction.status === TransactionStatus.PENDING &&
        this.isWithinLastSevenDays(transaction.createdAt)
    );
    return pendingTransactions.length;
  }

  //accepted orders
  calculateAcceptedOrders(): number {
    const acceptedTransactions = this._transactionList.filter(
      (transaction) =>
        transaction.status === TransactionStatus.ACCEPTED &&
        this.isWithinLastSevenDays(transaction.createdAt)
    );
    return acceptedTransactions.length;
  }

  //failed orders
  calculateFailedOrders(): number {
    const failedTransactions = this._transactionList.filter(
      (transaction) =>
        transaction.status === TransactionStatus.FAILED &&
        this.isWithinLastSevenDays(transaction.createdAt)
    );
    return failedTransactions.length;
  }

  //pickup orders
  calculatePickupOrders(): number {
    const pickupTransactions = this._transactionList.filter(
      (transaction) =>
        transaction.type === TransactionType.PICK_UP &&
        this.isWithinLastSevenDays(transaction.createdAt)
    );
    return pickupTransactions.length;
  }

  //delivery orders
  calculateDeliveryOrders(): number {
    const deliveryTransactions = this._transactionList.filter(
      (transaction) =>
        transaction.type === TransactionType.DELIVERY &&
        this.isWithinLastSevenDays(transaction.createdAt)
    );
    return deliveryTransactions.length;
  }

  printTransaction(title: string, transaction: Observable<Transactions[]>) {
    transaction.subscribe((data) => {
      this.printingService
        .printTransaction(title, data, this._users?.name ?? '')
        .then((data) => console.log('Printing Data'));
    });
  }
}
