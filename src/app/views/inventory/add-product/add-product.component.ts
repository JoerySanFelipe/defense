import { Location } from '@angular/common';
import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { ToastrService } from 'ngx-toastr';
import { ActionType, ComponentType } from 'src/app/models/audit/audit_type';
import { Products } from 'src/app/models/products';
import { UserType } from 'src/app/models/user-type';
import { Users } from 'src/app/models/users';
import { Variation } from 'src/app/models/variation';
import { AuditLogService } from 'src/app/services/audit-log.service';
import { AuthService } from 'src/app/services/auth.service';
import { LoadingService } from 'src/app/services/loading.service';
import { ProductService } from 'src/app/services/product.service';
import { generateInvoiceID } from 'src/app/utils/constants';
import { BatchNumberService } from 'src/app/services/batch-number.service';
import { v4 as uuidv4 } from 'uuid';
import { NgbModal, NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';

import {
  Observable,
  OperatorFunction,
  Subject,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  merge,
} from 'rxjs';
import { AddVariationComponent } from '../add-variation/add-variation.component';
import { EditVariationComponent } from 'src/app/components/edit-variation/edit-variation.component';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { AddprodAddvarComponent } from '../addprod-addvar/addprod-addvar.component';
declare var window: any;
@Component({
  selector: 'app-add-product',
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.css'],
  providers: [DecimalPipe],
})
export class AddProductComponent implements OnInit {
  options: string[] = [];
  _imageURL: string[] = [];
  productID: string;
  _selectedFiles: File[] = [];
  currentPage: string = 'basic'; // Tracks the current page

  variations: Variation[] = [];
  loading = false;

  productForm: FormGroup = new FormGroup({
    name: new FormControl('', Validators.required),
    description: new FormControl('', [
      Validators.required,
      Validators.maxLength(300),
    ]),
    category: new FormControl('', Validators.required),
    hasVariations: new FormControl(false),
    hasExpiry: new FormControl(false), // Checkbox for expiration toggle
    expire: new FormControl(null), // Null if no expiration date
    cost: new FormControl(0, Validators.required),
    price: new FormControl(0, Validators.required),
    stocks: new FormControl(0, Validators.required),
    stockAlert: new FormControl(0, Validators.required),
    batchNumber: new FormControl(''),
    minimum: new FormControl(0, Validators.required),
    shipping: new FormControl(0, Validators.required),

    // New fields for weight-based pricing
    isWeightBased: new FormControl(false), // Checkbox for enabling weight-based pricing
    weight: new FormControl(null), // Weight per unit in kg
    kgPrice: new FormControl(null), // Price per kilogram
  });

  products$: Products[] = [];
  users: Users | null = null;
  constructor(
    private productService: ProductService,
    public loadingService: LoadingService,
    private toaster: ToastrService,
    public location: Location,
    private authService: AuthService,
    private auditService: AuditLogService,
    private router: Router,
    private decimalPipe: DecimalPipe, // Inject DecimalPipe here
    private batchNumberService: BatchNumberService,
  ) {
    this.productID = generateInvoiceID();
    authService.users$.subscribe((data) => {
      this.users = data;
    });
  }

  private modalService = inject(NgbModal);

  ngOnInit(): void {
    this.productService.products$.subscribe((data) => {
      this.products$ = data;
      this.options = Array.from(new Set(data.map((e) => e.category)));
    });

    // Listen for changes in the hasVariations checkbox
    this.productForm
      .get('hasVariations')
      ?.valueChanges.subscribe((hasVariations) => {
        if (!hasVariations) {
          // If variations checkbox is unchecked, clear the variations list
          this.variations = [];
        }
      });
  }

  changePage(page: string): void {
    this.currentPage = page;
  }

  // Open Add Variation Modal
  openAddVarModal() {
    const modalRef = this.modalService.open(AddprodAddvarComponent, {
      size: 'lg',
      backdrop: 'static',
    });

    // Pass existing variations to the modal
    modalRef.componentInstance.variations = this.variations;

    // Handle the response when the modal closes
    modalRef.result
      .then((variation: Variation) => {
        if (variation) {
          this.variations.push(variation);
        }
      })
      .catch(() => {
        // Handle dismiss without adding
      });
  }
  // Remove Variation
  removeVariation(id: string) {
    this.variations = this.variations.filter(
      (variation) => variation.id !== id
    );
    this.toaster.info('Variation removed');
  }

  onSubmitProduct() {
    if (this._imageURL.length === 0) {
      this.toaster.warning('Please add an image to your product!', 'Image required');
      return;
    }
  
    if (this.productForm.invalid) {
      this.toaster.warning('Complete product information', '');
      return;
    }
  
    const hasExpiry = this.productForm.get('hasExpiry')?.value;
    const expire = this.productForm.get('expire')?.value;
  
    if (hasExpiry && !expire) {
      this.toaster.warning('Product has expiration date', 'Complete product information');
      return;
    }
  
    if (this.productForm.get('hasVariations')?.value && this.variations.length === 0) {
      this.toaster.warning('Please add at least one variation', 'Variation required');
      return;
    }
  
    if (this.productForm.get('isWeightBased')?.value) {
      const weight = this.productForm.get('weight')?.value;
      const kgPrice = this.productForm.get('kgPrice')?.value;
  
      if (!weight || !kgPrice) {
        this.toaster.warning('Complete weight-based pricing information', 'Weight-Based Pricing required');
        return;
      }
    }
  
    const batchExpiryStr = this.productForm.get('expire')?.value;
    const batchExpiry = batchExpiryStr ? new Date(batchExpiryStr) : null;
  
    // Ensure batch expiry date is saved for product and variations
    if (hasExpiry && batchExpiry) {
      this.variations.forEach((variation) => {
        if (!variation.batchNumber) {
          variation.batchNumber = [];
        }
        variation.batchNumber.forEach((batch) => {
          batch.batchExpiry = batchExpiry; // Ensure batchExpiry is updated
        });
        
        // Update expiryDate for the variation itself
        variation.expiryDate = batchExpiry;
      });
    }
  
    // Generate product with the updated expiry date
    const product = this.generateProduct();
    product.expiryDate = batchExpiry; // Ensure product expiryDate is updated
  
    // Upload images and save the product
    this.onUploadImages(product);
  }
     

  onImagePicked(event: any) {
    // Add selected image file to _selectedFiles array
    const files = event.target.files;
    this._selectedFiles.push(files[0]);

    // Convert image file to Data URL and push it to _imageURL array
    this.convertFileToDataURL(files[0], (dataURL) => {
      this._imageURL.push(dataURL);
    });
  }

  formatnumber(value: number): string {
    // Ensure the value is correctly formatted with two decimal places and a PHP sign (₱)
    const formattedValue = this.decimalPipe.transform(value, '1.2-2') || '';
    return `₱${formattedValue}`;
  }

  convertFileToDataURL(file: File, callback: (dataURL: string) => void) {
    const reader = new FileReader();
    reader.onload = () => {
      callback(reader.result as string);
    };
    reader.readAsDataURL(file);
  }
  deleteImage(index: number) {
    if (index >= 0 && index < this._imageURL.length) {
      this._imageURL.splice(index, 1);
      this._selectedFiles.splice(index, 1);
    }
  }

  onUploadImages(product: Products) {
    if (this._imageURL) {
      this.loadingService.showLoading('add-product');
      this.productService
        .uploadProductImages(this._selectedFiles, this.productID)
        .then((downloadURLs) => {
          product.images = downloadURLs;
          this.saveProduct(product);
        })
        .catch((error) => {
          console.error('Image upload failed:', error);
          this.loadingService.hideLoading('add-product');
        });
    }
  }

  async saveProduct(product: Products) {
    const productExists = this.products$.some(
      (data) => product.name.toLocaleLowerCase() === data.name.toLocaleLowerCase()
    );
    if (productExists) {
      this.toaster.warning(`${product.name} already exists`);
      this.loadingService.hideLoading('add-product');
      return;
    }
  
    // Ensure expiryDate is set for variations and batches
    this.variations.forEach((variation) => {
      const batchExpiry = variation.expiryDate || product.expiryDate;
  
      const batchData = this.batchNumberService.generateBatchNumber(
        product.id, // Use product ID here
        new Date(),
        0, // Assuming 0 for last sequence, modify as needed
        variation.stocks, // Assuming variations have stocks
        batchExpiry ?? null // Ensure null if batchExpiry is undefined
      );
  
      // Add batch number to the variation
      variation.batchNumber = variation.batchNumber || [];
      variation.batchNumber.push(batchData);
  
      // Ensure expiryDate is explicitly set for the variation
      variation.expiryDate = batchExpiry;
    });
  
    try {
      // Save the product with its variations (now including batch numbers and expiryDate)
      await this.productService.addProduct(product);
  
      // Create audit log
      await this.auditService.createAudit({
        id: '',
        email: this.users?.email || '',
        role: this.users?.type || UserType.ADMIN,
        action: ActionType.CREATE,
        component: ComponentType.INVENTORY,
        payload: {
          message: `New product Added by ${this.users?.name}`,
          user: this.users?.name,
          userID: this.users?.id,
          productID: product.id,
        },
        details: 'adding product',
        timestamp: new Date(),
      });
  
      this.toaster.success(`'${product.name}' has been successfully added.`, 'Product Added!');
    } catch (error) {
      this.toaster.error(error?.toString(), 'Error');
    } finally {
      this.loadingService.hideLoading('add-product');
      this.router.navigate([this.users?.type + '/view-product', product.id]);
    }
  }
  
  

  generateProduct(): Products {
    const lastSequence = 0; // Replace with actual logic to get the last sequence
    const stock = this.productForm.controls['stocks'].value ?? 0;

    // Get the batchExpiry from the form input
    const batchExpiry = this.productForm.controls['hasExpiry'].value
      ? new Date(this.productForm.controls['expire'].value)
      : null;

    // Call BatchNumberService to generate batch number
    const batchNumber = this.batchNumberService.generateBatchNumber(
      this.productID,
      new Date(),
      lastSequence,
      stock,
      batchExpiry // Pass batchExpiry here
    );

    const product: Products = {
      id: this.productID,
      images: this._imageURL,
      name: this.productForm.controls['name'].value ?? '',
      description: this.productForm.controls['description'].value ?? '',
      category: this.productForm.controls['category'].value ?? '',
      cost: this.productForm.controls['cost'].value ?? 0,
      price: this.productForm.controls['price'].value ?? 0,
      stocks: this.productForm.controls['stocks'].value ?? 0,
      stockAlert: this.productForm.controls['stockAlert'].value ?? 0,
      batchNumber: [batchNumber],
      variations: this.variations,
      expiryDate: batchExpiry, // Use batchExpiry here
      reviews: [],
      shippingInformation: {
        minimum: this.productForm.controls['minimum'].value ?? 0,
        shipping: this.productForm.controls['shipping'].value ?? 0,
      },
      createdAt: new Date(),
      updatedAt: null,
      isHidden: true,
      featured: false,
    };

    // Add weight-based pricing if enabled
    if (this.productForm.controls['isWeightBased'].value) {
      product.weightPricing = {
        weight: this.productForm.controls['weight'].value ?? 0,
        kgPrice: this.productForm.controls['kgPrice'].value ?? 0,
        remainingWeight: this.productForm.controls['weight'].value ?? 0,
      };
    }

    return product;
  }


  model: any;

  @ViewChild('instance', { static: true }) instance!: NgbTypeahead;

  focus$ = new Subject<string>();
  click$ = new Subject<string>();

  search: OperatorFunction<string, readonly string[]> = (
    text$: Observable<string>
  ) => {
    const debouncedText$ = text$.pipe(
      debounceTime(200),
      distinctUntilChanged()
    );
    const clicksWithClosedPopup$ = this.click$.pipe(
      filter(() => !this.instance.isPopupOpen())
    );
    const inputFocus$ = this.focus$;

    return merge(debouncedText$, inputFocus$, clicksWithClosedPopup$).pipe(
      map((term) =>
        (term === ''
          ? this.options
          : this.options.filter(
            (v) => v.toLowerCase().indexOf(term.toLowerCase()) > -1
          )
        ).slice(0, 10)
      )
    );
  };
}
