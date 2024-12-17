import {
  Component,
  OnDestroy,
  OnInit,
  AfterViewInit,
  inject,
} from '@angular/core';
import { User } from '@angular/fire/auth';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as bootstrap from 'bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ActionType, ComponentType } from 'src/app/models/audit/audit_type';
import { Order, Products, productToOrder } from 'src/app/models/products';
import { Transactions } from 'src/app/models/transaction/transactions';
import { UserType } from 'src/app/models/user-type';
import { Users } from 'src/app/models/users';
import { AuditLogService } from 'src/app/services/audit-log.service';
import { AuthService } from 'src/app/services/auth.service';
import { LoadingService } from 'src/app/services/loading.service';
import { ProductService } from 'src/app/services/product.service';
import { TransactionsService } from 'src/app/services/transactions.service';
import { computeSubTotal, formatPrice } from 'src/app/utils/constants';
import { ConfirmCheckoutComponent } from '../confirm-checkout/confirm-checkout.component';
import { PdfExportService } from 'src/app/services/reportgen/product/pdf-export.service';
import { LogoutComponent } from 'src/app/components/logout/logout.component';
import { UnitWeightSelectionComponent } from '../unit-weight-selection/unit-weight-selection.component';

declare var window: any;

@Component({
  selector: 'app-staff-home',
  templateUrl: './staff-home.component.html',
  styleUrls: ['./staff-home.component.css'],
})
export class StaffHomeComponent implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();

  _products: Products[] = [];
  _categories: string[] = [];
  _productItems: Order[] = [];
  _cart: Order[] = [];
  _users: Users | null = null;
  activeTab = 0;
  searchText = '';
  searchProductName = '';
  filteredProducts: { [category: string]: Order[] } = {};

  isSubtotalDisabled: boolean = false; 
  showDropdown: boolean = false;
  currentDropdownIndex: number | null = null;

  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private toastr: ToastrService,
    public loadingService: LoadingService,
    private transactionService: TransactionsService,
    private pdf: PdfExportService,
    private auditService: AuditLogService,
    private modalService: NgbModal
  ) {
    this.authService.users$
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this._users = value;
      });
  }

  ngOnInit(): void {
    this.productService
      .getAllProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: Products[]) => {
        this._categories = this.getCategories(
          data.map((e) => e.category.toLowerCase())
        );
        this._productItems = [];
        this._products = data.filter(
          (e) =>
            (!e.expiryDate || e.expiryDate.getTime() > new Date().getTime()) &&
            !e.isHidden
        );
  
        this._products.forEach((product) => {
          this._productItems.push(...productToOrder(product));
        });
  
        this.applyFilter();
      });
  }

  ngAfterViewInit(): void {
    const element = document.getElementById('productTabs');
    if (element) {
      new bootstrap.Tab(element).show();
    }
  
    // Add event listener for clicks outside the dropdown
    document.addEventListener('click', (event) => {
      if (this.currentDropdownIndex !== null) {
        // Close dropdown if click is outside
        const target = event.target as HTMLElement;
        if (!target.closest('.dropdown')) {
          this.hideDropdown();
        }
      }
    });
  }  

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectTab(index: number) {
    this.activeTab = index;
  }

  // Filter products by category
  filterProductsPerCategory(category: string): Order[] {
    return this._productItems.filter(
      (e) => e.category.toLowerCase() === category.toLowerCase()
    );
  }

  applyFilter(): void {
    this._categories.forEach((category) => {
      const filteredProducts = this.filterProductsPerCategory(category).filter(
        (product) =>
          product.name
            .toLowerCase()
            .includes(this.searchProductName.toLowerCase())
      );
      this.filteredProducts[category] = filteredProducts;
    });
  }

  search(): void {
    if (this.searchText.trim() === '') {
      this.applyFilter();
    } else {
      this.filteredProducts = {};
      this._categories.forEach((category) => {
        const filtered = this.filterProductsPerCategory(category).filter(
          (product) =>
            product.name
              .toLowerCase()
              .includes(this.searchText.toLowerCase()) ||
            product.category
              .toLowerCase()
              .includes(this.searchText.toLowerCase())
        );
        if (filtered.length) {
          this.filteredProducts[category] = filtered;
        }
      });
    }
  }

  countStocks(product: Products): number {
    return product.variations.reduce(
      (count, data) => count + data.stocks,
      product.stocks
    );
  }

  isExpired(product: Products): boolean {
    const currentDate = new Date();
    return product.expiryDate
      ? product.expiryDate.getTime() < currentDate.getTime()
      : false;
  }

  getCategories(data: string[]): string[] {
    return Array.from(new Set(data));
  }

  showConfirmCheckoutDialog() {
    const modal = this.modalService.open(ConfirmCheckoutComponent, {
      size: 'xl',
    });
    modal.componentInstance.users = this._users;
    modal.componentInstance.orders = this._cart;
    modal.result
      .then((data: any) => {
        let transaction = data as Transactions;
        if (transaction) {
          this.confirmOrder(transaction);
        } else {
          this.toastr.error('Invalid transaction');
        }
      })
      .catch((err) => {
        this.toastr.error(err.toString());
      });
  }

  formatPrice(num: number): string {
    return formatPrice(num);
  }

  addOrder(product: any, isUnitBased: boolean = true) {
    // Check if the product already exists in the cart
    const existingOrder = this._cart.find((o) => 
      o.productID === product.id && 
      ((isUnitBased && !o.weightPricing) || (!isUnitBased && o.weightPricing))
    );
  
    if (existingOrder) {
      this.toastr.warning('Product already in cart', 'Warning');
      return; // Stop duplicate addition
    }
  
    // Prepare order object
    const order: Order = {
      ...product,
      quantity: 1,
      price: product.price, // Default price
      weightPricing: isUnitBased ? null : { ...product.weightPricing }, // Weight-based if applicable
    };
  
    // Add the order to the cart
    this._cart.unshift(order);
  }  
  

  logout() {
    this.modalService.open(LogoutComponent);
  }

  increaseQuantity(index: number, order: Order) {
    if (order.stocks > order.quantity) {
      this._cart[index].quantity += 1;
    }
  }

  decreaseQuantity(index: number) {
    const order = this._cart[index];
    if (order.quantity < 2) {
      this._cart.splice(index, 1);
    } else {
      this._cart[index].quantity -= 1;
    }
  }

  subtotal(orders: Order[]): string {
    let total = 0;
  
    orders.forEach(order => {
      const quantity = order.quantity || 0; // Default to 0 if quantity is undefined
      if (order.weightPricing && order.weightPricing.kgPrice) {
        // Ensure kgPrice is valid and numeric
        const kgPrice = order.weightPricing.kgPrice || 0;
        total += kgPrice * quantity;
      } else if (order.price) {
        // Ensure price is valid and numeric
        total += order.price * quantity;
      }
    });
  
    return this.formatPrice(total);
  }  

  openModal() {
    if (this._cart.length === 0) {
      this.toastr.warning(
        'Please add product to checkout',
        'No product in cart'
      );
      return;
    }
    if (this._users === null) {
      this.toastr.error('No cashier logged in!', 'Invalid Transaction');
      return;
    }
    this.showConfirmCheckoutDialog();
  }

  confirmOrder(transaction: Transactions) {
    this.loadingService.showLoading('checkout');
    this.transactionService
      .createTransaction(transaction)
      .then(async () => {
        await this.productService.batchUpdateProductQuantity(
          transaction.orderList
        );
        this.pdf.exportTransaction(transaction, this._users ?? null);
        this.toastr.success('Transaction success');
      })
      .catch((err) => this.toastr.error(err.message))
      .finally(async () => {
        await this.auditService.createAudit({
          id: '',
          email: this._users?.email ?? '',
          role: UserType.STAFF,
          action: ActionType.CREATE,
          component: ComponentType.TRANSACTION,
          payload: {
            message: `Order confirmed`,
            cashier: `${this._users?.name}`,
            date: new Date().toLocaleDateString(),
          },
          details: 'Adding transaction',
          timestamp: new Date(),
        });

        this.loadingService.hideLoading('checkout');
        this._cart = [];
      });
  }

  signOut() {
    this.authService.logout();
  }

  toProductStatus(order: Order): string {
    const quantity = order.stocks;
    const expiration = order.expiration;

    if (expiration && expiration.getTime() < new Date().getTime()) {
      return 'expired';
    }
    if (quantity <= 0) return 'out of stock';
    if (quantity <= 50) return 'low stock';
    return 'in stock';
  }

openUnitWeightSelection(product: any, isVariation: boolean = false) {
  // Check if the product has weight-based purchase enabled
  if (product.weightPricing && product.weightPricing.kgPrice) {
    // Open modal for weight-based products
    const modalRef = this.modalService.open(UnitWeightSelectionComponent, { size: 'lg' });
    modalRef.componentInstance.product = product;
    modalRef.componentInstance.isVariation = isVariation;

    modalRef.result.then(
      (result) => {
        if (result) {
          if (result.selectedOption === 'Weight-Based' && product.weightPricing) {
            this.addOrderWithWeight(product, result.selectedWeight);
          } else {
            this.addOrder(product);
          }
        }
      },
      () => {}
    );
  } else {
    // Directly add the product to the cart for unit-based purchases
    this.addOrder(product);
  }
}
    
  addOrderWithWeight(product: any, weight: number) {
    // Check if an existing order with the same product ID and weight-based pricing exists
    const existingOrder = this._cart.find(
      (order) => order.productID === product.id && order.weightPricing
    );
  
    if (existingOrder) {
      // Update the existing weight-based order
      existingOrder.quantity += weight;
      existingOrder.price += product.weightPricing.kgPrice * weight;
      console.log('Updated Order:', existingOrder); // Log the updated order
    } else {
      // Create a new weight-based order and add it to the cart
      const order: Order = {
        ...product,
        product: product,  // Store the full product object
        quantity: weight,  // For weight-based, quantity is the selected weight
        price: product.weightPricing.kgPrice * weight, // Price based on weight
        weightPricing: true, // Indicate that this order is weight-based
      };
      this._cart.unshift(order);
      console.log('New Order:', order); // Log the new order created
    }
  
    // Log the kgPrice used to calculate the price
    console.log('kgPrice used:', product.kgPrice);
} 

adjustWeightQuantity(index: number) {
  const order = this._cart[index];

  if (order.weightPricing) {
    const remainingWeight = order.weightPricing.remainingWeight as number; // Type assertion

    if (order.quantity > remainingWeight) {

      this.toastr.error('Quantity exceeds the remaining weight of the product.');

      // Reset the quantity to the maximum allowed
      order.quantity = remainingWeight;
    } else {
      this.isSubtotalDisabled = false;
    }
  }
}

removeFromCart(index: number): void {
  this._cart.splice(index, 1); // Removes the item at the specified index from the cart
}

  // Toggle dropdown visibility when input field is clicked
  toggleDropdown(index: number, event: MouseEvent) {
    // If the clicked dropdown is already open, close it; otherwise, open it
    if (this.currentDropdownIndex === index) {
      this.currentDropdownIndex = null;  // Close the dropdown
    } else {
      this.currentDropdownIndex = index;  // Open the clicked dropdown
    }
    this.showDropdown = this.currentDropdownIndex === index;
    event.stopPropagation();  // Prevent event from bubbling up to document
  }

  

  // Hide dropdown if the user clicks outside the dropdown or input field
  hideDropdown() {
    this.currentDropdownIndex = null;  // Close any open dropdown
  }

  // Select the quantity and adjust the weight
  selectQuantity(quantity: number, index: number) {
    this._cart[index].quantity = quantity;
    this.adjustWeightQuantity(index);
    this.hideDropdown();  // Hide dropdown after selection
  }


}