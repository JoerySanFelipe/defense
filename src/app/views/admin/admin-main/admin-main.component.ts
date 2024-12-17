import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { Auth, User, user } from '@angular/fire/auth';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { LogoutComponent } from 'src/app/components/logout/logout.component';
import { UserWithMessages } from 'src/app/models/UserWithMessages';
import { Messages } from 'src/app/models/messages';
import { TransactionStatus } from 'src/app/models/transaction/transaction_status';
import { Transactions } from 'src/app/models/transaction/transactions';
import { Users } from 'src/app/models/users';
import { AuthService } from 'src/app/services/auth.service';
import { MessagesService } from 'src/app/services/messages.service';
import { TransactionsService } from 'src/app/services/transactions.service';
import { removeDuplicateMessages } from 'src/app/utils/constants';
import { contentActions } from '../contents/store/actions';

@Component({
  selector: 'app-admin-main',
  templateUrl: './admin-main.component.html',
  styleUrls: ['./admin-main.component.css'],
})
export class AdminMainComponent implements OnInit {
  users$: Users | null = null;

  transactionSubscription: Subscription;
  $messages: UserWithMessages[] = [];
  $transactions: Transactions[] = [];
  private modalService = inject(NgbModal);
  constructor(
    private authService: AuthService,
    private messageService: MessagesService,
    private transactionService: TransactionsService,
    private cdr: ChangeDetectorRef,
    private store: Store
  ) {
    this.transactionSubscription = new Subscription();
    this.transactionSubscription = transactionService
      .getAllTransactions()
      .subscribe((data) => {
        this.$transactions = data.filter(
          (e) => e.status === TransactionStatus.PENDING
        );
        transactionService.setTransactions(data);
      });
    authService.users$.subscribe((data) => {
      this.users$ = data;
      messageService
        .getCustomerWithMessages(data?.id ?? '')
        .subscribe((data) => {
          this.$messages = data;
          messageService.updateMessages(this.$messages);
        });
    });
  }

  ngOnInit(): void {
    this.store.dispatch(contentActions.getSubjectWithTopics());
  }

  logout() {
    this.modalService.open(LogoutComponent);
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
