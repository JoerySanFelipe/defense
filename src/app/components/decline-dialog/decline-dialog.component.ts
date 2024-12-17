import { Component, Input, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Transactions } from 'src/app/models/transaction/transactions';

@Component({
  selector: 'app-decline-dialog',
  templateUrl: './decline-dialog.component.html',
  styleUrls: ['./decline-dialog.component.css'],
})
export class DeclineDialogComponent {
  activeModal = inject(NgbActiveModal);
  @Input('transaction') transaction!: Transactions;
  reason: string = '';
  constructor(private toastr: ToastrService) {}

  onReasonSelect(event: Event) {
    const selectedReason = (event.target as HTMLSelectElement).value;
    this.reason = selectedReason;
  }  

  submit() {
    if (this.reason === '') {
      this.toastr.warning('Please Add a reason');
      return;
    }
    this.activeModal.close(this.reason);
  }
}
