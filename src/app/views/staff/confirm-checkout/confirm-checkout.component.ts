import { Component, Input, inject } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Order } from 'src/app/models/products';
import {
  OrderItems,
  ordersToOrderItems,
} from 'src/app/models/transaction/order_items';
import {
  PaymentDetails,
  PaymentStatus,
  PaymentType,
} from 'src/app/models/transaction/payment';
import { TrasactionDetails } from 'src/app/models/transaction/transaction_details';
import { TransactionStatus } from 'src/app/models/transaction/transaction_status';
import { TransactionType } from 'src/app/models/transaction/transaction_type';
import { Transactions } from 'src/app/models/transaction/transactions';
import { Users } from 'src/app/models/users';
import { LoadingService } from 'src/app/services/loading.service';
import { ToastrService } from 'ngx-toastr'; // Added import for ToastrService
import {
  computeSubTotal,
  formatPrice,
  generateInvoiceID,
} from 'src/app/utils/constants';

@Component({
  selector: 'app-confirm-checkout',
  templateUrl: './confirm-checkout.component.html',
  styleUrls: ['./confirm-checkout.component.css'],
})
export class ConfirmCheckoutComponent {
  @Input() users: Users | null = null;
  @Input() orders: Order[] = [];
  activeModal = inject(NgbActiveModal);
  discountValue: number = 0;

  paymentForm$: FormGroup;

  // Inject ToastrService
  constructor(
    public loadingService: LoadingService,
    private fb: FormBuilder,
    private toastr: ToastrService  // Injected ToastrService
  ) {
    this.paymentForm$ = fb.nonNullable.group({
      cashReceived: [
        0,
        [Validators.required, cashReceivedValidator(() => this.totalAmount)],
      ],
      discount: [0],
    });
  }

  setDiscount(value: number): void {
    this.discountValue = value;
  }

  confirmPayment() {
    if (this.paymentForm$.invalid) {
      return;
    }

    let transactionID = generateInvoiceID();
    const values = this.paymentForm$.value;
    const cash = values.cashReceived;
    const discount: number = values.discount ?? 0;
    let items = ordersToOrderItems(this.orders);

    this.orders.forEach((order) => {
      if (order.weightPricing && order.weightPricing.remainingWeight !== undefined) {
        const weightPurchased = order.quantity;
        if (order.weightPricing.remainingWeight >= weightPurchased) {
          order.weightPricing.remainingWeight -= weightPurchased;
        } else {
          this.toastr.warning('Not enough weight available for purchase.');
          return; 
        }
      }
    });

    let details: TrasactionDetails = {
      updatedBy: '',
      message: `Cashier : ${
        this.users?.name ?? ''
      }  received :  ${this.formatNumber(cash)} total order value : ${this.formatNumber(
        this.subtotal(this.orders)
      )}`,
      status: TransactionStatus.COMPLETED,
      updatedAt: Timestamp.now(),
      seen: false,
      id: generateInvoiceID(),
      transactionID: transactionID,
    };

    let paymentDetails: PaymentDetails = {
      confirmedBy: this.users?.name ?? '',
      reference: '',
      attachmentURL: '',
      createdAt: new Date(),
      cashReceive: cash,
    };

    let transaction: Transactions = {
      id: transactionID,
      customerID: '',
      driverID: '',
      cashierID: this.users?.id ?? '',
      type: TransactionType.WALK_IN,
      orderList: items,
      message: '',
      status: TransactionStatus.COMPLETED,
      payment: {
        amount: this.totalAmount,  // Ensure correct total amount
        type: PaymentType.PAY_IN_COUNTER,
        status: PaymentStatus.PAID,
        details: paymentDetails,
        discount: discount,
      },
      details: [details],
      createdAt: new Date(),
    };

    this.activeModal.close(transaction);
  }

  subtotal(orders: Order[]): number {
    return computeSubTotal(orders);
  }

  formatNumber(num: number): string {
    return formatPrice(num);
  }

  get totalAmount(): number {
    if (this.paymentForm$) {
      const form = this.paymentForm$.value;
      const subtotal = this.subtotal(this.orders);
      const discount = form?.discount || 0;
      const discountAmount = (subtotal * discount) / 100;
      const total = subtotal - discountAmount;

      return total;
    }
    return 0;
  }
}

export function cashReceivedValidator(
  getTotalAmount: () => number
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const cashReceived = control.value;
    const totalAmount = getTotalAmount();
    return cashReceived >= totalAmount ? null : { cashReceivedInvalid: true };
  };
}
