import { Component, inject, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { QRCodes } from 'src/app/models/payment-qr/qr-codes';
import { GcashPaymentService } from 'src/app/services/gcash-payment.service';

@Component({
  selector: 'app-add-gcash-payment',
  templateUrl: './add-gcash-payment.component.html',
  styleUrls: ['./add-gcash-payment.component.css'],
})
export class AddGcashPaymentComponent {
  activeModal = inject(NgbActiveModal);

  @Input() count!: number;
  gcashPaymentForm$: FormGroup;
  contentFile$: File | null = null;
  constructor(
    private gcashPaymentService: GcashPaymentService,
    private fb: FormBuilder,
    private toastr: ToastrService
  ) {
    this.gcashPaymentForm$ = fb.nonNullable.group({
      name: ['', Validators.required],
      phone: ['', [Validators.required]],
    });
  }
  onSelectImage(event: any) {
    const files = event.target.files[0];
    this.contentFile$ = files;
  }
  submit() {
    if (this.gcashPaymentForm$.invalid) {
      this.toastr.error('Payment form error');
      return;
    }
    if (this.contentFile$ === null) {
      this.toastr.error('Please add qr code');
      return;
    }
    let form = this.gcashPaymentForm$.value;
    let name = form.name ?? '';
    let phone = form.phone ?? '';
    let isDefault = this.count == 0 ? true : false;
    let grCode: QRCodes = {
      id: '',
      phone: String(phone),
      name: name,
      qrCode: '',
      isDefault: isDefault,
      createdAt: new Date(),
    };
    this.gcashPaymentService
      .addGcashPayment(grCode, this.contentFile$)
      .then(() => this.toastr.success('Successfully Added!'))
      .catch((err) => this.toastr.error(err['message'].toString()))
      .finally(() => this.activeModal.close());
  }
}
