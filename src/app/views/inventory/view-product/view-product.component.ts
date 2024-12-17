import { Location } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { AddStocksComponent } from 'src/app/components/add-stocks/add-stocks.component';
import { DeleteProductDialogComponent } from 'src/app/components/delete-product-dialog/delete-product-dialog.component';
import { ActionType, ComponentType } from 'src/app/models/audit/audit_type';
import { Products } from 'src/app/models/products';
import { UserType } from 'src/app/models/user-type';
import { Users } from 'src/app/models/users';
import { AuditLogService } from 'src/app/services/audit-log.service';
import { AuthService } from 'src/app/services/auth.service';
import { LoadingService } from 'src/app/services/loading.service';
import { ProductService } from 'src/app/services/product.service';

@Component({
  selector: 'app-view-product',
  templateUrl: './view-product.component.html',
  styleUrls: ['./view-product.component.css'],
})
export class ViewProductComponent implements OnInit, OnDestroy {
  productID: string = '';
  products$: Products | null = null;
  users$: Users | null = null;
  productSub$: Subscription;
  constructor(
    private activatedRoute: ActivatedRoute,
    private productService: ProductService,
    public loadingService: LoadingService,
    private authService: AuthService,
    private toastr: ToastrService,
    private location: Location,
    private router: Router,
    private auditLogService: AuditLogService,
    private cdr: ChangeDetectorRef
  ) {
    this.productSub$ = new Subscription();
    authService.users$.subscribe((data) => {
      this.users$ = data;
    });
  }

  private modalService = inject(NgbModal);

  showDeleteProduct(product: Products) {
    const modalRef = this.modalService.open(DeleteProductDialogComponent);
    modalRef.componentInstance.product = product;
    modalRef.result.then((data: string) => {
      if (data !== 'confirm') {
        this.toastr.error('Failed deletion');
      } else {
        this.deleteProduct(product);
      }
    });
  }

  addNewStocks(product: Products) {
    const modalRef = this.modalService.open(AddStocksComponent);
    modalRef.componentInstance.product = product;
    modalRef.result.then((data: string) => {});
  }
  ngOnInit(): void {
    this.activatedRoute.paramMap.subscribe((param) => {
      this.productID = param.get('id') ?? '';
      this.subscribeProduct(this.productID);
    });
  }
  ngOnDestroy(): void {
    this.productSub$.unsubscribe();
  }
  subscribeProduct(id: string) {
    this.productSub$ = this.productService
      .getProductByID(id)
      .subscribe((prod) => {
        this.products$ = prod;
      });
  }

  deleteProduct(data: Products) {
    this.loadingService.showLoading('deleting');
    this.productService.deleteProductByID(data.id).subscribe({
      next: async (v) => {
        await this.auditLogService.createAudit({
          id: '',
          email: this.users$?.email ?? 'no email',
          role: this.users$?.type ?? UserType.ADMIN,
          action: ActionType.DELETE,
          component: ComponentType.INVENTORY,
          payload: {
            message: `Product Deleted by ${this.users$?.name}!`,
            product_id: data.id,
            user: this.users$?.name,
            userID: this.users$?.id,
          },
          details: 'deleting product from inventory',
          timestamp: new Date(),
        });
        this.loadingService.hideLoading('deleting');
        this.toastr.success(
          `${data.name} deleted successfully!`,
          'Deletion Successful'
        );
      },

      error: (v) => {
        this.toastr.error(v.message, 'Error Deleting product');
      },
      complete: () => {
        this.location.back();
      },
    });
  }
  editProduct(product: Products) {
    const navigationExtras: NavigationExtras = {
      queryParams: {
        product: JSON.stringify(product),
      },
    };
    this.router.navigate(
      [this.users$?.type + '/edit-product'],
      navigationExtras
    );
  }

  addToFeaturedProduct(productID: string) {
    this.productService
      .addToFeaturedProduct(productID)
      .then(() => {
        this.toastr.success('Successfully Added!');
      })
      .catch((err) => {
        this.toastr.error(err.toString());
      })
      .finally(() => {
        this.products$!.featured = true;
      });
  }

  removeFromFeaturedProduct(productID: string) {
    this.productService
      .removeFromFeaturedProduct(productID)
      .then(() => {
        this.toastr.success('Successfully removed!');
      })
      .catch((err) => {
        this.toastr.error(err.toString());
      })
      .finally(() => {
        this.products$!.featured = false;
      });
  }

  hideProduct(productID: string, value: boolean) {
    this.productService
      .hideProduct(productID, value)
      .then(() => {
        this.toastr.success('Successfully Updated');
      })
      .catch((err) => {
        this.toastr.error(err['message'].toString());
      });
  }
}
