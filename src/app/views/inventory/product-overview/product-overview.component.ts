import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { Timestamp, deleteDoc } from '@angular/fire/firestore';
import { Products } from 'src/app/models/products';
import {
  formatPrice,
  formatTimestamp,
  getEffectivePrice,
} from 'src/app/utils/constants';
import { AddVariationComponent } from '../add-variation/add-variation.component';
import { Variation } from 'src/app/models/variation';
import { ToastrService } from 'ngx-toastr';
import { ProductService } from 'src/app/services/product.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { deleteObject } from '@angular/fire/storage';
import { Users } from 'src/app/models/users';
import { AuthService } from 'src/app/services/auth.service';
import { Subscription } from 'rxjs';
import { EditProductComponent } from '../edit-product/edit-product.component';
import { EditVariationComponent } from 'src/app/components/edit-variation/edit-variation.component';
import { BatchNumberService } from 'src/app/services/batch-number.service';

@Component({
  selector: 'app-product-overview',
  templateUrl: './product-overview.component.html',
  styleUrls: ['./product-overview.component.css'],
})
export class ProductOverviewComponent implements OnInit, OnDestroy {
  private modalService = inject(NgbModal);

  @Input() product!: Products;

  private users$: Users | null = null;
  private userSub$: Subscription | undefined;
  constructor(
    private toastr: ToastrService,
    private productService: ProductService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.userSub$ = this.authService.users$.subscribe((data) => {
      this.users$ = data;
    });
  }
  ngOnDestroy(): void {
    if (this.userSub$) {
      this.userSub$.unsubscribe();
    }
  }
  
  formatTimestamp(timestamp: Date | null): string {
    if (!timestamp) {
      return 'Non-Expiring';
    }
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Intl.DateTimeFormat('en-US', options).format(new Date(timestamp));
  }
  

  formatPrice(product: Products) {
    return getEffectivePrice(product);
  }
  formatnumber(num: number) {
    return formatPrice(num);
  }

  get getStocks(): number {
    let total = this.product.stocks;
    this.product.variations.forEach((e) => {
      total += e.stocks;
    });
    return total;
  }
  addVariation() {
    const modalRef = this.modalService.open(AddVariationComponent);
    modalRef.componentInstance.productID = this.product.id;
    modalRef.componentInstance.variations = this.product.variations;
    modalRef.result
      .then((data: Variation) => {
        if (data) {
          this.saveVariation(this.product.id, data);
        }
      })
      .catch((err) => this.toastr.error(err.toString()));
  }

  private saveVariation(productID: string, variation: Variation) {
    if (this.users$ !== null) {
      this.productService
        .addVariation(productID, variation, this.users$)
        .then((data) => {
          this.toastr.success('Successfully Added');
        })
        .catch((err) => this.toastr.error(err['message'].toString()));
    }
  }

  private updateVariation(productID: string, variation: Variation[]) {
    if (this.users$ !== null) {
      this.productService
        .updateVariation(productID, variation, this.users$)
        .then((data) => {
          this.toastr.success('Successfully Updated');
        })
        .catch((err) => this.toastr.error(err['message'].toString()));
    }
  }
  deletevariation(productID: string, variation: Variation) {
    if (this.users$ !== null) {
      this.productService
        .deleteVariation(productID, variation, this.users$)
        .then((data) => {
          this.toastr.success('Successfully Deleted');
        })
        .catch((data) => {
          this.toastr.error(data['message'].toString());
        });
    }
  }

  // @Input() variations: Variation[] = [];
  // @Input() index!: number;
  // @Input() productID!: string;

  editVariation(index: number) {
    const modal = this.modalService.open(EditVariationComponent);
    modal.componentInstance.variations = this.product.variations;
    modal.componentInstance.index = index;
    modal.componentInstance.productID = this.product.id;
    modal.result.then((data: Variation | null) => {
      if (data !== null) {
        let id = this.product.id;
        this.product.variations[index] = data;
        this.updateVariation(id, this.product.variations);
      }
    });
  }
}
