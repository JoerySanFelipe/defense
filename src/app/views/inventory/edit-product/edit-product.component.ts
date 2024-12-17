import { Location } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  inject,
} from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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
import {
  convertTimestampToDate,
  formatTimestamp,
} from 'src/app/utils/constants';
import { AddVariationComponent } from '../add-variation/add-variation.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EditVariationComponent } from 'src/app/components/edit-variation/edit-variation.component';
declare var window: any;
@Component({
  selector: 'app-edit-product',
  templateUrl: './edit-product.component.html',
  styleUrls: ['./edit-product.component.css'],
})
export class EditProductComponent implements OnInit {
  _default: Products | null = null;
  product: Products | null = null;
  _imageURL: string[] = [];
  _selectedFiles: File[] = [];
  productForm: FormGroup = new FormGroup({
    name: new FormControl('', Validators.required),
    description: new FormControl('', [
      Validators.required,
      Validators.maxLength(500),
    ]),
    category: new FormControl('', Validators.required),
    expire: new FormControl(new Date(), Validators.required),
    cost: new FormControl(0, Validators.required),
    price: new FormControl(0, Validators.required),
    stocks: new FormControl(0, Validators.required),
    stockAlert: new FormControl(0, Validators.required), 
    minimum: new FormControl(0, Validators.required),
    shipping: new FormControl(0, Validators.required),
  });
  users: Users | null = null;
  constructor(
    public loadingService: LoadingService,
    public location: Location,
    private toastr: ToastrService,
    private productService: ProductService,
    private activatedRoute: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private auditService: AuditLogService
  ) {
    authService.users$.subscribe((data) => {
      this.users = data;
    });
  }
  ngOnInit(): void {
    this.activatedRoute.queryParams.subscribe((params) => {
      const products = params['product'];
      this.product = JSON.parse(products);
      this._default = JSON.parse(products);
  
      if (this._default) {
        const created = new Date(this._default.createdAt);
        this._default.createdAt = created;
  
        if (this._default.expiryDate) {
          const dateObject = new Date(this._default.expiryDate);
          this._default.expiryDate = dateObject;
        } else {
          this._default.expiryDate = null;
        }
      }
  
      if (this.product) {
        const createdDate = new Date(this.product.createdAt);
        this.product.createdAt = createdDate;
  
        const expire = this.product.expiryDate
          ? new Date(this.product.expiryDate)
          : null;
        const expirationDateString = expire
          ? expire.toISOString().slice(0, 10)
          : '';
  
        this.product.expiryDate = expire;
  
        this.productForm.patchValue({
          name: this.product.name || '',
          description: this.product.description || '',
          category: this.product.category || '',
          expire: expirationDateString, // Safe string assignment
          cost: this.product.cost || 0,
          price: this.product.price || 0,
          stocks: this.product.stocks || 0,
          stockAlert: this.product.stockAlert || 0,
          minimum: this.product.shippingInformation?.minimum || 0,
          shipping: this.product.shippingInformation?.shipping || 0,
        });
  
        this._imageURL = this.product.images || [];
      }
  
      this.cdr.detectChanges();
    });
  }
  

  onSubmitProduct() {
    if (this._imageURL.length == 0) {
      this.toastr.warning(
        'Please add an image to your product!',
        'Image required'
      );
    } else if (this.productForm.invalid) {
      this.toastr.warning('Complete product information', '');
    } else {
      (this.product!.name = this.productForm.controls['name'].value ?? ''),
        (this.product!.description =
          this.productForm.controls['description'].value ?? ''),
        (this.product!.category =
          this.productForm.controls['category'].value ?? '');

      (this.product!.cost = this.productForm.controls['cost'].value ?? 0),
        (this.product!.price = this.productForm.controls['price'].value ?? 0),
        (this.product!.stocks = this.productForm.controls['stocks'].value ?? 0),
        (this.product!.stockAlert = this.productForm.controls['stockAlert'].value ?? 0),
        (this.product!.expiryDate = new Date(
          this.productForm.controls['expire'].value
        ));

      (this.product!.shippingInformation.minimum =
        this.productForm.controls['minimum'].value ?? 0),
        (this.product!.shippingInformation.shipping =
          this.productForm.controls['shipping'].value ?? 0),
        console.log(this.product);
      this.saveProduct(this.product!);
    }
  }
  onImagePicked(event: any) {
    const files = event.target.files[0];
    this.uploadImage(this.product?.id || '', files);
  }

  convertFileToDataURL(file: File, callback: (dataURL: string) => void) {
    const reader = new FileReader();
    reader.onload = () => {
      callback(reader.result as string);
    };
    reader.readAsDataURL(file);
  }
  deleteImage(index: number, url: string) {
    this.productService
      .deleteImage(url)
      .then(() => {
        this.toastr.success('Successfully Deleted!');
        if (index >= 0 && index < this._imageURL.length) {
          this._imageURL.splice(index, 1);
          this._selectedFiles.splice(index, 1);
        }
      })
      .catch((err) => {
        this.toastr.error(err.toString());
      });
  }

  uploadImage(productID: string, file: File) {
    if (this._imageURL) {
      this.loadingService.showLoading('product-image');
      this.productService
        .uploadsSingleProductImage(productID, file)
        .then((downloadURLs) => {
          this.product?.images.push(downloadURLs);
          console.log(downloadURLs);
        })
        .catch((error) => {
          console.error('Image upload failed:', error);
          this.loadingService.hideLoading('product-image');
        });
    }
  }
  saveProduct(product: Products) {
    this.loadingService.showLoading('add-product');
    product.updatedAt = new Date();
    this.productService
      .updateProduct(product)
      .then(async (data) => {
        await this.auditService.createAudit({
          id: '',
          email: this.users?.email || '',
          role: this.users?.type || UserType.ADMIN,
          action: ActionType.UPDATE,
          component: ComponentType.INVENTORY,
          payload: {
            message: `Product updated by ${this.users?.name}`,
            user: this.users?.name,
            userId: this.users?.id,
            productID: product.id,
          },
          details: 'updating product',
          timestamp: new Date(),
        });
        this.toastr.success('successfully updated', 'Product Updated!');
      })
      .catch((err) => {
        this.loadingService.hideLoading('add-product');
        this.toastr.error(err.message, 'Error');
      })
      .finally(() => {
        this.loadingService.hideLoading('add-product');
        this.location.back();
        this.location.back();
      });
  }

  getProduct() {
    console.log(this.product);
  }

  generateProduct(): Products {
    let product: Products = {
      id: this.product?.id || '',
      images: [],
      name: this.productForm.controls['name'].value ?? '',
      description: this.productForm.controls['description'].value ?? '',
      category: this.productForm.controls['category'].value ?? '',
      cost: this.productForm.controls['cost'].value ?? 0,
      price: this.productForm.controls['price'].value ?? 0,
      stocks: this.productForm.controls['stocks'].value ?? 0,
      stockAlert: this.productForm.controls['stockAlert'].value ?? 0,
      variations: this.product?.variations ?? [],
      expiryDate: this.getExpiryDate(), // Use a helper method for handling expiry date
      reviews: [],
      shippingInformation: {
        minimum: this.productForm.controls['minimum'].value ?? 0,
        shipping: this.productForm.controls['shipping'].value ?? 0,
      },
      createdAt: new Date(this.product!.createdAt?.toString() || new Date().toISOString()),
      updatedAt: new Date(),
      isHidden: this.product?.isHidden ?? false,
      featured: false,
    };
    return product;
  }
  
  // Helper function to safely handle expiry date
  private getExpiryDate(): Date | null {
    const formValue = this.productForm.controls['expire'].value;
    if (formValue) {
      return new Date(formValue);
    }
    return this.product?.expiryDate ?? null;
  }
}
