import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { LogoutComponent } from 'src/app/components/logout/logout.component';
import { UserWithMessages } from 'src/app/models/UserWithMessages';
import { Messages } from 'src/app/models/messages';
import { Transactions } from 'src/app/models/transaction/transactions';
import { Users } from 'src/app/models/users';
import { AuthService } from 'src/app/services/auth.service';
import { MessagesService } from 'src/app/services/messages.service';
import { TransactionsService } from 'src/app/services/transactions.service';
import { removeDuplicateMessages } from 'src/app/utils/constants';

@Component({
  selector: 'app-staff-main',
  templateUrl: './staff-main.component.html',
  styleUrls: ['./staff-main.component.css'],
})
export class StaffMainComponent implements OnInit, OnDestroy {
  transactionSubscription: Subscription;
  $transactions: Transactions[] = [];
  $messages: UserWithMessages[] = [];
  users$: Users | null = null;
  constructor(
    public authService: AuthService,
    private messageService: MessagesService,
    private transactionService: TransactionsService
  ) {
    authService.users$.subscribe((data) => {
      this.users$ = data;
      this.listenToMessages(this.users$?.id ?? '');
    });

    this.transactionSubscription = this.transactionService
      .getAllTransactions()
      .subscribe((data) => {
        this.transactionService.setTransactions(data);
        this.$transactions = data.filter((e) => e.status === 'PENDING');
      });
  }
  private modalService = inject(NgbModal);
  logout() {
    this.modalService.open(LogoutComponent);
  }
  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.transactionSubscription.unsubscribe();
  }
  listenToMessages(uid: string) {
    this.messageService.getCustomerWithMessages(uid).subscribe((data) => {
      this.$messages = data;
      this.messageService.updateMessages(data);
    });
  }
  countNewMessages(messages: UserWithMessages[], uid: string): number {
    let total = 0;
    messages.map((data) => {
      if (data.messages.length !== 0) {
        if (data.messages[data.messages.length - 1].senderID !== uid) {
          total += 1;
        }
      }
    });
    return total;
  }
}
