import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Users } from 'src/app/models/users';
import { AuthService } from 'src/app/services/auth.service';
import { EditProfileComponent } from '../edit-profile/edit-profile.component';
import { TransactionsService } from 'src/app/services/transactions.service';
import { Transactions } from 'src/app/models/transaction/transactions';
import { TransactionStatus } from 'src/app/models/transaction/transaction_status';
import { formatPrice } from 'src/app/utils/constants';
import { LogoutComponent } from '../logout/logout.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
  users$: Users | null = null;
  today = new Date();
  private modalService = inject(NgbModal);
  transactions$: Transactions[] = [];
  constructor(
    private transactionService: TransactionsService,
    private authService: AuthService,
    private router: Router
  ) {
    transactionService.transactions$.subscribe((data) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      this.transactions$ = data.filter((e) => {
        const transactionDate = new Date(e.createdAt);
        const details = e.details[e.details.length - 1];
        transactionDate.setHours(0, 0, 0, 0);
        const updatedAt = details.updatedAt.toDate();
        updatedAt.setHours(0, 0, 0, 0);
        return (
          e.status === TransactionStatus.COMPLETED &&
          (transactionDate.getTime() === today.getTime() ||
            updatedAt.getTime() === today.getTime())
        );
      });
    });
    authService.users$.subscribe((data) => {
      this.users$ = data;
    });
  }

  navigateToProfile() {
    this.router.navigate(['admin/profile']);
  }
  logout() {
    this.modalService.open(LogoutComponent);
  }

  editProfile() {
    const modal = this.modalService.open(EditProfileComponent);
    modal.componentInstance.users = this.users$;
  }

  get salesToday() {
    let count = 0;
    this.transactions$.map((e) => {
      count += e.payment?.amount;
    });
    return formatPrice(count);
  }
}
