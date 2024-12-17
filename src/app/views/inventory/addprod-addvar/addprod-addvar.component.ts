import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Variation } from 'src/app/models/variation';
import { LoadingService } from 'src/app/services/loading.service';
import { ProductService } from 'src/app/services/product.service';
import { BatchNumberService } from 'src/app/services/batch-number.service'; // Import the BatchNumberService
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-addprod-addvar',
  templateUrl: './addprod-addvar.component.html',
  styleUrls: ['./addprod-addvar.component.css']
})
export class AddprodAddvarComponent {
  @Input() variations: Variation[] = [];
  @Input() productID!: string;
  activeModal = inject(NgbActiveModal);
  selectedFile: File | null = null;

  constructor(
    private productService: ProductService,
    private toastr: ToastrService,
    public loadingService: LoadingService,
    private batchNumberService: BatchNumberService // Inject the BatchNumberService
  ) { }

  addvarForm = new FormGroup({
    name: new FormControl('', Validators.required),
    cost: new FormControl(0, Validators.required),
    price: new FormControl(0, Validators.required),
    stocks: new FormControl(0, Validators.required),
    stockAlert: new FormControl(0, Validators.required),
    weightBasedPurchase: new FormControl(false),
    weight: new FormControl(0),
    kgPrice: new FormControl(0),
    hasExpiry: new FormControl(false),
    expire: new FormControl('')
  });

  handleExpirationDateInput(event: any) {
    // This method will be triggered when the user enters an expiration date
    const selectedDate = event.target.value;
    console.log('Expiration Date Selected:', selectedDate);
    // You can handle further logic for the expiration date here (like validation or conversion)
  }

  toggleWeightBasedPurchase() {
    if (this.addvarForm.controls['weightBasedPurchase'].value) {
      this.addvarForm.controls['weight'].setValidators([Validators.required]);
      this.addvarForm.controls['kgPrice'].setValidators([Validators.required]);
    } else {
      this.addvarForm.controls['weight'].clearValidators();
      this.addvarForm.controls['kgPrice'].clearValidators();
    }
    this.addvarForm.controls['weight'].updateValueAndValidity();
    this.addvarForm.controls['kgPrice'].updateValueAndValidity();
  }

  onImagePicked(event: any) {
    const files = event.target.files[0];
    this.selectedFile = files;
  }

  async submitForm() {
    let varName = this.addvarForm.controls.name.value ?? '';
    let isVariationPresent = false;
  
    // Check for duplicate variation name
    this.variations.forEach((element) => {
      if (varName.toLocaleLowerCase() === element.name.toLocaleLowerCase()) {
        isVariationPresent = true;
      }
    });
  
    if (isVariationPresent) {
      this.toastr.warning('Variation already exists!');
      return;
    }
  
    if (this.addvarForm.valid) {
      this.loadingService.showLoading('add-variation');
  
      // Convert the batchExpiry to a Date object
      const batchExpiryStr = this.addvarForm.controls['expire'].value;
      const batchExpiry = batchExpiryStr ? new Date(batchExpiryStr) : null;
  
      let variation: Variation = {
        id: uuidv4(),
        image: '',
        name: this.addvarForm.controls.name.value ?? '',
        cost: this.addvarForm.controls.cost.value ?? 0,
        price: this.addvarForm.controls.price.value ?? 0,
        stocks: this.addvarForm.controls.stocks.value ?? 0,
        stockAlert: this.addvarForm.controls.stockAlert.value ?? 0,
        ...(this.addvarForm.controls['weightBasedPurchase'].value && {
          weightPricing: {
            weight: this.addvarForm.controls.weight.value ?? 0,
            kgPrice: this.addvarForm.controls.kgPrice.value ?? 0,
            remainingWeight: this.addvarForm.controls.weight.value ?? 0,
          },
        }),
        ...(this.addvarForm.controls['hasExpiry'].value && {
          expiryDate: batchExpiry,
        }),
      };
  
      // Upload the image if provided
      if (this.selectedFile !== null) {
        this.uploadImage(this.selectedFile, variation);
      } else {
        this.addvarForm.reset();
        this.loadingService.hideLoading('add-variation');
        this.activeModal.close(variation);
      }
    }
  }  

  uploadImage(file: File, variation: Variation) {
    this.productService
      .uploadVariationImage(this.productID, file)
      .then((data) => {
        variation.image = data;
        this.activeModal.close(variation);
      })
      .catch((err) => {
        this.toastr.error(err.message, 'Uploading image variation failed');
      })
      .finally(() => {
        this.addvarForm.reset();
        this.loadingService.hideLoading('add-variation');
      });
  }
}
