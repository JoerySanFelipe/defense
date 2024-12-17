// import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
// import { FormControl, FormGroup, Validators } from '@angular/forms';
// import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
// import { ToastrService } from 'ngx-toastr';
// import { Variation } from 'src/app/models/variation';
// import { LoadingService } from 'src/app/services/loading.service';
// import { ProductService } from 'src/app/services/product.service';
// import { v4 as uuidv4 } from 'uuid';


// @Component({
//   selector: 'app-add-variation',
//   templateUrl: './add-variation.component.html',
//   styleUrls: ['./add-variation.component.css'],
// })
// export class AddVariationComponent {
//   @Input() variations: Variation[] = [];
//   @Input() productID!: string;
//   activeModal = inject(NgbActiveModal);
//   selectedFile: File | null = null;

//   constructor(
//     private productService: ProductService,
//     private toastr: ToastrService,
//     public loadingService: LoadingService
//   ) {}
  
//   variationForm = new FormGroup({
//     name: new FormControl('', Validators.required),
//     cost: new FormControl(0, Validators.required),
//     price: new FormControl(0, Validators.required),
//     stocks: new FormControl(0, Validators.required),
//     stockAlert: new FormControl(0, Validators.required),
//   });

//   onImagePicked(event: any) {
//     const files = event.target.files[0];
//     this.selectedFile = files;
//   }

//   submitForm() {
//     let varName = this.variationForm.controls.name.value ?? '';
//     var isVariationPresent = false;
//     this.variations.forEach((element) => {
//       if (varName.toLocaleLowerCase() === element.name.toLocaleLowerCase()) {
//         isVariationPresent = true;
//       }
//     });
//     if (isVariationPresent) {
//       this.toastr.warning('Variation already exists!');
//       return;
//     }
//     if (this.variationForm.valid) {
//       this.loadingService.showLoading('add-variation');
//       let variation: Variation = {
//         id: uuidv4(),
//         image: '',
//         name: this.variationForm.controls.name.value ?? '',
//         cost: this.variationForm.controls.cost.value ?? 0,
//         price: this.variationForm.controls.price.value ?? 0,
//         stocks: this.variationForm.controls.stocks.value ?? 0,
//         stockAlert: this.variationForm.controls.stocks.value ?? 0,
//       };
//       if (this.selectedFile !== null) {
//         this.uploadImage(this.selectedFile, variation);
//       } else {
//         this.variationForm.reset();
//         this.loadingService.hideLoading('add-variation');
//       }
//     }
//   }

//   uploadImage(file: File, variation: Variation) {
//     this.productService
//       .uploadVariationImage(this.productID, file)
//       .then((data) => {
//         variation.image = data;
//         this.activeModal.close(variation);
//       })
//       .catch((err) => {
//         this.toastr.error(err.message, 'Uploading image variation failed');
//       })
//       .finally(() => {
//         this.variationForm.reset();
//         this.loadingService.hideLoading('add-variation');
//       });
//   }
// }
