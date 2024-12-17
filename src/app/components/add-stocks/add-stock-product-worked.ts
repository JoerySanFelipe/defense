// import { CommonModule } from '@angular/common';
// import { Component, Input, OnInit, inject } from '@angular/core';
// import { Timestamp } from '@angular/fire/firestore';
// import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
// import { ToastrService } from 'ngx-toastr';
// import { ActionType, ComponentType } from 'src/app/models/audit/audit_type';
// import { Products } from 'src/app/models/products';
// import { UserType } from 'src/app/models/user-type';
// import { Users } from 'src/app/models/users';
// import { Variation } from 'src/app/models/variation';
// import { AuditLogService } from 'src/app/services/audit-log.service';
// import { AuthService } from 'src/app/services/auth.service';
// import { ProductService } from 'src/app/services/product.service';
// import { BatchNumberService } from 'src/app/services/batch-number.service';
// import { take } from 'rxjs';

// @Component({
//   selector: 'app-add-stocks',
//   templateUrl: './add-stocks.component.html',
//   styleUrls: ['./add-stocks.component.css'],
// })
// export class AddStocksComponent implements OnInit {
//   activeModal = inject(NgbActiveModal);
//   @Input() product!: Products;

//   users$: Users | null = null;
//   expirationDate: Date | null = null;
//   variations$: { id: string; name: string; stocks: number }[] = [];
//   newStocks = 0;
//   newStocksValue = 0;

//   constructor(
//     private productService: ProductService,
//     private toastr: ToastrService,
//     private auditLogService: AuditLogService,
//     private authService: AuthService,
//     private batchNumberService: BatchNumberService,
//   ) {
//     authService.users$.subscribe(data => { this.users$ = data; });
//   }

//   ngOnInit(): void {
//     this.product.variations.forEach(e => {
//       this.variations$.push({ id: e.id, name: e.name, stocks: 0 });
//     });
//   }

//   handleExpirationDateInput(event: Event) {
//     const inputValue = (event.target as HTMLInputElement).value;
//     this.expirationDate = inputValue ? new Date(inputValue) : null;
//   }

//   updateVariationStock(index: number, event: Event) {
//     const newValue = parseInt((event.target as HTMLInputElement).value);
//     if (!isNaN(newValue)) {
//       this.variations$[index].stocks += newValue;
//     }
//   }

//   updateProductStocks(event: Event) {
//     this.newStocksValue = parseInt((event.target as HTMLInputElement).value);
//     this.newStocks = this.product.stocks + parseInt((event.target as HTMLInputElement).value);
//   }

//   saveStocks() {
//     this.productService.getProductByID(this.product.id).pipe(take(1)).subscribe(productData => {
//       if (!productData) {
//         this.toastr.error('Product not found!');
//         return;
//       }

//       const lastBatch = productData.batchNumber?.[productData.batchNumber.length - 1];
//       const lastSequence = lastBatch ? parseInt(lastBatch.batchNumber.split('-').pop()!) : 0;
//       const stockToAdd = this.newStocks;
//       const batchValue = this.newStocksValue
//       const batchData = this.batchNumberService.generateBatchNumber(
//         this.product.id, new Date(), lastSequence, batchValue
//       );

//       this.product.batchNumber = this.product.batchNumber || [];
//       this.product.batchNumber.push(batchData);

//       this.productService.addStocks(this.product.id, stockToAdd, this.product.variations, this.expirationDate!)
//         .then(() => this.productService.updateProduct({
//           ...this.product,
//           batchNumber: this.product.batchNumber,
//           stocks: stockToAdd,
//         }))
//         .then(() => this.logAudit(batchData))
//         .catch(err => this.toastr.error(err['message']?.toString() || 'An error occurred'));
//     });
//   }

//   private async logAudit(batchData: any) {
//     await this.auditLogService.createAudit({
//       id: '',
//       email: this.users$?.email || '',
//       role: this.users$?.type || UserType.ADMIN,
//       action: ActionType.UPDATE,
//       component: ComponentType.INVENTORY,
//       payload: {
//         message: `Added new stocks with batch number: ${batchData.batchNumber}`,
//         productID: this.product.id,
//         user: this.users$?.name,
//         userId: this.users$?.id,
//       },
//       details: 'Adding new stocks to inventory',
//       timestamp: new Date(),
//     });

//     this.toastr.success('Successfully added new stocks!');
//     this.activeModal.close();
//   }
// }
