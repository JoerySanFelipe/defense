import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Order } from 'src/app/models/products';
import { ordersToOrderItems } from 'src/app/models/transaction/order_items';
import {
  Payment,
  PaymentDetails,
  PaymentStatus,
  PaymentType,
} from 'src/app/models/transaction/payment';
import { TrasactionDetails } from 'src/app/models/transaction/transaction_details';
import { TransactionStatus } from 'src/app/models/transaction/transaction_status';
import { TransactionType } from 'src/app/models/transaction/transaction_type';
import { Transactions } from 'src/app/models/transaction/transactions';
import { Users } from 'src/app/models/users';
import { AuthService } from 'src/app/services/auth.service';
import { LoadingService } from 'src/app/services/loading.service';
import { computeSubTotal, formatPrice } from 'src/app/utils/constants';

@Component({
  selector: 'app-add-payment',
  templateUrl: './add-payment.component.html',
  styleUrls: ['./add-payment.component.css'],
})
export class AddPaymentComponent implements OnInit {
  users: Users | null = null;
  @Input() transaction!: Transactions;
  cashReceived: number = 0;
  activeModal = inject(NgbActiveModal);
  constructor(
    public loadingService: LoadingService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService
  ) {}
  ngOnInit(): void {
    this.authService.users$.subscribe((value) => {
      this.users = value;
    });
  }

  submit() {
    if (this.cashReceived == 0) {
      this.toastr.error('Please add cash');
      return;
    }
    let details: PaymentDetails = {
      confirmedBy: this.users?.name ?? '',
      cashReceive: this.cashReceived,
      reference: '',
      attachmentURL: '',
      createdAt: new Date(),
    };
    this.transaction!.payment.status = PaymentStatus.PAID;
    this.transaction!.payment.details = details;

    if (this.users !== null) {
      this.activeModal.close(this.transaction);
    }
  }
  subtotal(orders: Order[]): number {
    return computeSubTotal(orders);
  }
  formatNumber(num: number): string {
    return formatPrice(num);
  }

  onCashReceivedChange(num: number) {
    this.cashReceived = num;
  }
  computeChange(total: number, cashReceived: number): number {
    if (total >= cashReceived) {
      return 0;
    }
    return cashReceived - total;
  }

  isCashReceivedNaN(): boolean {
    return isNaN(this.cashReceived);
  }
}
