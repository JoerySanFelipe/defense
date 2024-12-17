import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Customers } from 'src/app/models/customers';
import { CustomerService } from 'src/app/services/customer.service';

@Component({
  selector: 'app-customer-info',
  templateUrl: './customer-info.component.html',
  styleUrls: ['./customer-info.component.css'],
})
export class CustomerInfoComponent implements OnInit {
  @Input() customerID: string = '';
  customer: Customers | null = null;
  customer$: Observable<Customers | null> | undefined;
  constructor(private customerService: CustomerService) {}
  ngOnInit(): void {
    if (this.customerID !== '') {
      this.customer$ = this.customerService.getCustomerInfo(this.customerID);
    }
  }
  customerProfile() {
    if (this.customer?.profile != null || this.customer?.profile != '') {
      return this.customer?.profile;
    } else {
      return '../../../assets/images/profile.jpg';
    }
  }
}
