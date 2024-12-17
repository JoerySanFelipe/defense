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
  selector: 'app-add-variation',
  templateUrl: './add-variation.component.html',
  styleUrls: ['./add-variation.component.css'],
})
export class AddVariationComponent {
  @Input() variations: Variation[] = [];
  @Input() productID!: string;
  activeModal = inject(NgbActiveModal);
  selectedFile: File | null = null;

  // Add expirationDate property
  expirationDate: Date | null = null;

  constructor(
    private productService: ProductService,
    private toastr: ToastrService,
    public loadingService: LoadingService,
    private batchNumberService: BatchNumberService // Inject the BatchNumberService
  ) {}

  variationForm = new FormGroup({
    name: new FormControl('', Validators.required),
    cost: new FormControl(0, Validators.required),
    price: new FormControl(0, Validators.required),
    stocks: new FormControl(0, Validators.required),
    stockAlert: new FormControl(0, Validators.required),
    weightBasedPurchase: new FormControl(false),
    weight: new FormControl(0),
    kgPrice: new FormControl(0),
  });

  toggleWeightBasedPurchase() {
    if (this.variationForm.controls['weightBasedPurchase'].value) {
      this.variationForm.controls['weight'].setValidators([Validators.required]);
      this.variationForm.controls['kgPrice'].setValidators([Validators.required]);
    } else {
      this.variationForm.controls['weight'].clearValidators();
      this.variationForm.controls['kgPrice'].clearValidators();
    }
    this.variationForm.controls['weight'].updateValueAndValidity();
    this.variationForm.controls['kgPrice'].updateValueAndValidity();
  }

  onImagePicked(event: any) {
    const files = event.target.files[0];
    this.selectedFile = files;
  }

  handleExpirationDateInput(event: Event) {
    const inputValue = (event.target as HTMLInputElement).value;
    this.expirationDate = inputValue ? new Date(inputValue) : null;
  }

  async submitForm() {
    let varName = this.variationForm.controls.name.value ?? '';
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

    if (this.variationForm.valid) {
      this.loadingService.showLoading('add-variation');

      let variation: Variation = {
        id: uuidv4(),
        image: '',
        name: this.variationForm.controls.name.value ?? '',
        cost: this.variationForm.controls.cost.value ?? 0,
        price: this.variationForm.controls.price.value ?? 0,
        stocks: this.variationForm.controls.stocks.value ?? 0,
        stockAlert: this.variationForm.controls.stockAlert.value ?? 0,
        ...(this.variationForm.controls['weightBasedPurchase'].value && {
          weightPricing: {
            weight: this.variationForm.controls.weight.value ?? 0,
            kgPrice: this.variationForm.controls.kgPrice.value ?? 0,
            remainingWeight: this.variationForm.controls.weight.value ?? 0,
          },
        }),
      };

      if (this.variations.length === 0) {
        await this.productService.updateProductStock(this.productID, 0);
      }

      // Generate batch number and associate it with the variation
      const batchData = this.batchNumberService.generateBatchNumber(
        this.productID,
        new Date(),
        0, // Assuming 0 for last sequence, modify as needed
        this.variationForm.controls.stocks.value ?? 0,
        this.expirationDate // Include batchExpiry here
      );

      // Add batch number to the variation
      variation.batchNumber = variation.batchNumber || [];
      variation.batchNumber.push(batchData);

      // Upload the image if provided
      if (this.selectedFile !== null) {
        this.uploadImage(this.selectedFile, variation);
      } else {
        this.variationForm.reset();
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
        this.variationForm.reset();
        this.loadingService.hideLoading('add-variation');
      });
  }
}
