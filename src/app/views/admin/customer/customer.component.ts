import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CustomerAddress } from 'src/app/models/addresses';

import { Customers } from 'src/app/models/customers';
import { Messages } from 'src/app/models/messages';

import { AuthService } from 'src/app/services/auth.service';
import { CustomerService } from 'src/app/services/customer.service';

import { MessagesService } from 'src/app/services/messages.service';
import {
  getDefaultAddress,
  getFormattedLocation,
} from 'src/app/utils/constants';

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css'],
})
export class CustomerComponent implements OnInit, OnDestroy {
  $customers: Customers[] = [];
  $customerSubscription: Subscription;

  searchCustomerName: string = ''; //Added
  filterCustomers: Customers[] = []; //Added

  constructor(
    private customerService: CustomerService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    this.$customerSubscription = new Subscription();
  }
  ngOnInit(): void {
    this.$customerSubscription = this.customerService
      .getAllCustomer()
      .subscribe((customers) => {
        this.$customers = customers;
        this.applyFilter(); //Added
        this.cdr.detectChanges();
      });
  }
  ngOnDestroy(): void {
    this.$customerSubscription.unsubscribe();
  }

  getDefaultAddressFormattedLocation(addressList: CustomerAddress[]): string {
    const defaultAddress = addressList.find((e) => e.isDefault) || null;
    if (defaultAddress !== null) {
      return getFormattedLocation(defaultAddress);
    }
    return 'No Default Address';
  }

  viewProfile(customer: Customers) {
    console.log(customer);
    this.router.navigate(['/admin/view-profile'], {
      queryParams: customer,
    });
  }
  //Added
  applyFilter(): void {
    this.filterCustomers = this.$customers.filter((Customers) =>
      Customers.name
        .toLowerCase()
        .includes(this.searchCustomerName.toLowerCase())
    );
  }
  //END
}
