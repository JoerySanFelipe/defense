import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { Customers } from 'src/app/models/customers';
import { PaymentType } from 'src/app/models/transaction/payment';
import { TrasactionDetails } from 'src/app/models/transaction/transaction_details';
import { TransactionType } from 'src/app/models/transaction/transaction_type';
import { Transactions } from 'src/app/models/transaction/transactions';
import { Address } from 'src/app/models/user_address';
import { Users } from 'src/app/models/users';
import { AuthService } from 'src/app/services/auth.service';
import { CustomerService } from 'src/app/services/customer.service';
import { PdfExportService } from 'src/app/services/review-transaction/pdf-export-service.service';
import { TransactionsService } from 'src/app/services/transactions.service';
import { formatPrice, formatTimestamp } from 'src/app/utils/constants';

@Component({
  selector: 'app-review-transaction',
  templateUrl: './review-transaction.component.html',
  styleUrls: ['./review-transaction.component.css'],
})
export class ReviewTransactionComponent implements OnInit, OnDestroy {
  _transaction: Transactions | null = null;
  transacationSub$: Subscription;
  userSub$: Subscription;
  driver$: Users | null = null;
  details$: TrasactionDetails[] = [];
  transactionID: string = '';
  customerSub$: Subscription;
  customerData: Customers | null = null;
  constructor(
    private activatedRoute: ActivatedRoute,
    public location: Location,
    private transactionService: TransactionsService,
    private pdfExportService: PdfExportService,
    private authService: AuthService,
    private customerService: CustomerService
  ) {
    this.userSub$ = new Subscription();
    this.transacationSub$ = new Subscription();
    this.customerSub$ = new Subscription();
    this.activatedRoute.params.subscribe((params) => {
      this.transactionID = params['id'];
    });
  }

  paymentDate: string = '';
  ngOnInit(): void {
    this.transacationSub$ = this.transactionService
      .getTransactionByID(this.transactionID)
      .subscribe((data) => {
        this._transaction = data;
        console.log(data.driverID);
        this.details$ = data.details.reverse();
        if (data.customerID !== '') {
          this.getCustomerData(data.customerID);
        }
        if (data.driverID !== '') {
          this.userSub$ = this.authService
            .getUserByID(data.driverID)
            .subscribe((data) => {
              console.log(data);
              this.driver$ = data;
            });
        }
      });
  }

  getCustomerData(customerID: string) {
    this.customerSub$ = this.customerService
      .getCustomerInfo(customerID)
      .subscribe((data) => {
        this.customerData = data;
        console.log(data);
        console.log('customerID' + customerID);
      });
  }
  ngOnDestroy(): void {
    this.transacationSub$.unsubscribe();
    this.userSub$.unsubscribe();
    this.customerSub$.unsubscribe();
  }
  isGcash(type: PaymentType): boolean {
    if (type == PaymentType.GCASH) {
      return true;
    }
    return false;
  }
  isDelivery(type: TransactionType): boolean {
    if (type == TransactionType.DELIVERY) {
      return true;
    }
    return false;
  }

  displayAddress(address: Address | null) {
    if (address === null) {
      return '';
    }
    return `${address.landmark}, ${address.barangay}, ${address.city}, ${address?.province}, ${address?.region} | ${address?.postalCode}`;
  }

  downloadPdf(): void {
    if (this._transaction) {
      this.pdfExportService.exportTransactionAsPdf(this._transaction);
    }
  }

  goBack(): void {
    this.location.back();
  }
  openLinkInNewTab(link: string): void {
    window.open(link, '_blank');
  }
  format(date?: any) {
    if (typeof date === 'string') {
      return formatTimestamp(new Date(date as string));
    }
    if (date instanceof Date) {
      return formatTimestamp(date);
    }
    if (date instanceof Timestamp) {
      return formatTimestamp(date.toDate());
    }
    return '----';
  }
  formatPrice(price: number) {
    return formatPrice(price);
  }
}
