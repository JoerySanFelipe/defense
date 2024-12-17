import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { PaymentQr } from 'src/app/models/payments-qr';
import { TargetSales } from 'src/app/models/sales/target-sales';
import { PaymentService } from 'src/app/services/payment.service';
import { TargetSalesService } from 'src/app/services/target-sales.service';
import { combineLatest, filter, map, Observable, Subscription } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NewsletterDialogComponent } from 'src/app/components/newsletter-dialog/newsletter-dialog.component';
import { NewsletterService } from 'src/app/services/newsletter.service';
import { NewsLetter } from 'src/app/models/newsletter';
import '@angular/localize/init';
import { QRCodes } from 'src/app/models/payment-qr/qr-codes';
import { AddGcashPaymentComponent } from 'src/app/components/add-gcash-payment/add-gcash-payment.component';
import { Store } from '@ngrx/store';
import { settingsAction } from './store/settings.actions';
import {
  selectErrors,
  selectIsLoading,
  selectQrCodes,
} from './store/settings.reducers';
import { GcashPaymentService } from 'src/app/services/gcash-payment.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
})
export class SettingsComponent implements OnInit {
  selectedDate: string = new Date().getFullYear().toString();
  targetSales: TargetSales[] = [];

  private modalService = inject(NgbModal);
  selectedNewsletters: string[] = [];
  allNewsLetters$: NewsLetter[] = [];

  page = 1;
  pageSize = 10;
  newsLetterSize = 0;
  qrCodes$: QRCodes[] = [];
  settingsState$ = combineLatest({
    isLoading: this.store.select(selectIsLoading),
    data: this.store.select(selectQrCodes),
    errors: this.store.select(selectErrors),
  });
  defaultPaymentMethod$: Observable<QRCodes | null> = this.settingsState$.pipe(
    map((data) => data.data.find((qrCode) => qrCode.isDefault === true) || null)
  );
  constructor(
    private targetSalesService: TargetSalesService,
    private toastr: ToastrService,
    private paymentService: PaymentService,
    private newsLetterService: NewsletterService,
    private gcashPymentService: GcashPaymentService,
    private store: Store
  ) {}
  ngOnInit(): void {
    this.store.dispatch(settingsAction.getAllPayments());

    this.settingsState$.subscribe((data) => {
      this.qrCodes$ = data.data;
    });
  }

  createNewsletterModal() {
    this.modalService.open(NewsletterDialogComponent);
  }
  getTargetSalesByYear(year: string) {
    this.targetSalesService.getAllTargetSales(year).subscribe(
      (data) => {
        this.targetSales = data;
      },
      (error) => {
        this.toastr.error('Failed to retrieve target sales.');
      }
    );
  }

  deleteTargetSales(id: string) {
    this.targetSalesService.deleteTargetSales(id).then(
      () => {
        this.toastr.success('Successfully Deleted');
      },
      (error) => {
        this.toastr.error('Failed to delete target sales.');
      }
    );
  }

  uploadPayment() {
    const modal = this.modalService.open(AddGcashPaymentComponent);
    modal.componentInstance.count = this.qrCodes$.length;
  }

  navigateToPaymentQR(downloadUrl: string) {
    window.open(downloadUrl, '_blank');
  }

  isChecked = false;
  isIndeterminate = false;

  onCheckboxChange(event: any) {
    console.log('Checkbox checked:', event.target.checked);
    console.log('Indeterminate:', this.isIndeterminate);
  }

  updatePaymentDefault(id: string) {
    this.gcashPymentService.updateDefault(id);
  }
}
