import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Products } from 'src/app/models/products';
import { LoadingService } from 'src/app/services/loading.service';

@Component({
  selector: 'app-delete-product-dialog',
  templateUrl: './delete-product-dialog.component.html',
  styleUrls: ['./delete-product-dialog.component.css'],
})
export class DeleteProductDialogComponent {
  @Input() product?: Products;
  confirm: string = '';
  activeModal = inject(NgbActiveModal);
  constructor(public loadingService: LoadingService) {}
  onChange(event: any) {
    this.confirm = event.target.value;
  }
  confirmDelete() {
    if (this.product !== null) {
      this.activeModal.close(this.confirm);
    }
  }
}
