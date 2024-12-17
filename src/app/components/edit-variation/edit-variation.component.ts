import { Component, Inject, Input, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Variation } from 'src/app/models/variation';
import { LoadingService } from 'src/app/services/loading.service';
import { ProductService } from 'src/app/services/product.service';

@Component({
  selector: 'app-edit-variation',
  templateUrl: './edit-variation.component.html',
  styleUrls: ['./edit-variation.component.css'],
})
export class EditVariationComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  @Input() variations: Variation[] = [];
  @Input() index: number = -1;
  @Input() productID: string = '';
  variationForm: FormGroup;
  variationImage$: string = '../../../assets/images/product.png';
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private toastr: ToastrService,
    public loadingService: LoadingService
  ) {
    this.variationForm = fb.group({
      name: new FormControl('', Validators.required),
      cost: new FormControl(0, Validators.required),
      price: new FormControl(0, Validators.required),
      stocks: new FormControl(0, Validators.required),
      stockAlert: new FormControl(0, Validators.required),
    });
  }
  ngOnInit(): void {
    this.variationImage$ = this.variations[this.index].image;
    this.variationForm = this.fb.group({
      name: new FormControl(
        this.variations[this.index].name,
        Validators.required
      ),
      cost: new FormControl(
        this.variations[this.index].cost,
        Validators.required
      ),
      price: new FormControl(
        this.variations[this.index].price,
        Validators.required
      ),
      stocks: new FormControl(
        this.variations[this.index].stocks,
        Validators.required
      ),
      stockAlert: new FormControl(
        this.variations[this.index].stockAlert,
        Validators.required
      ),
    });
  }

  onImagePicked(event: any) {
    const files = event.target.files[0];
    this.selectedFile = files;
    if (event.target.files) {
      let reader = new FileReader();
      reader.readAsDataURL(event.target.files[0]);
      reader.onload = (e: any) => {
        this.variationImage$ = e.target.result;
      };
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
        this.loadingService.hideLoading('add-variation');
      });
  }
  submitForm() {
    const formValues = this.variationForm.value;
    const varName = formValues.name?.trim() || '';
  
    // Check if the variation name already exists
    const isVariationPresent = this.variations.some(
      (element, index) =>
        index !== this.index &&
        varName.toLowerCase() === element.name.toLowerCase()
    );
  
    if (isVariationPresent) {
      this.toastr.warning('Variation already exists!');
      return;
    }
  
    if (this.variationForm.valid) {
      this.loadingService.showLoading('add-variation');
      Object.assign(this.variations[this.index], {
        name: varName,
        cost: Number(formValues.cost) || 0,
        price: Number(formValues.price) || 0,
        stocks: Number(formValues.stocks) || 0,
        stockAlert: Number(formValues.stockAlert) || 0,
      });
  
      if (this.selectedFile !== null) {
        this.uploadImage(this.selectedFile, this.variations[this.index]);
      } else {
        this.variationForm.reset();
        this.loadingService.hideLoading('add-variation');
        this.activeModal.close(this.variations[this.index]);
      }
    }
  }  
}
