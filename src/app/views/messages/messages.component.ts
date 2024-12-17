import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';
import { ToastrService } from 'ngx-toastr';
import {
  Observable,
  Subscription,
  combineLatest,
  forkJoin,
  map,
  switchMap,
} from 'rxjs';
import { UserWithMessages } from 'src/app/models/UserWithMessages';
import { Customers } from 'src/app/models/customers';
import { Messages, Role } from 'src/app/models/messages';
import { Users } from 'src/app/models/users';
import { AuthService } from 'src/app/services/auth.service';
import { MessagesService } from 'src/app/services/messages.service';
import { formatTimeDifference } from 'src/app/utils/constants';

@Component({
  selector: 'app-messages',
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css'],
})
export class MessagesComponent implements OnInit, OnDestroy {
  selectedCustomer: Customers | null = null;
  selectedUser: Users | null = null;
  searchText: string = '';
  $customers: Customers[] = [];

  messages$: UserWithMessages[] = [];
  ALL$: UserWithMessages[] = [];
  users$: Users | null = null;
  messageSubscription$: Subscription;
  selectedConvo$: UserWithMessages | null = null;
  message$: string = '';
  selectConvo(userWithMessages: UserWithMessages) {
    this.selectedConvo$ = userWithMessages;
  }
  constructor(
    private authService: AuthService,
    private messagesService: MessagesService,
    private cdr: ChangeDetectorRef,
    private toatr: ToastrService
  ) {
    authService.users$.subscribe((data) => {
      this.users$ = data;
    });
    this.messageSubscription$ = new Subscription();
    messagesService.messages$.subscribe((data) => {
      this.ALL$ = data;
      this.messages$ = data;
      this.selectedConvo$ = data[1];
    });
  }
  ngOnDestroy(): void {
    this.messageSubscription$.unsubscribe();
  }

  ngOnInit(): void {}

  search() {
    if (this.searchText === '') {
      this.messages$ = this.ALL$;
    } else {
      this.messages$ = this.ALL$.filter((e) => {
        return e.customers.name
          .toLowerCase()
          .includes(this.searchText.toLowerCase());
      });
    }
  }

  searchCustomer() {
    if (this.searchText === '') {
      this.messages$ = this.ALL$;
    } else {
      this.messages$ = this.ALL$.filter((e) => {
        return e.customers.name
          .toLowerCase()
          .includes(this.searchText.toLowerCase());
      });
    }
  }

  formatDate(timestamp: Timestamp) {
    return formatTimeDifference(timestamp);
  }

  sendMessage(to: string | null) {
    if (this.message$ === '') {
      this.toatr.warning('Please add a message');
      return;
    }
    let message: Messages = {
      id: `${to}${this.users$?.id}`,
      senderID: this.users$?.id ?? '',
      receiverID: to ?? '',
      role: Role.STAFF,
      message: this.message$,
      seen: false,
      createdAt: Timestamp.now(),
    };
    this.messagesService
      .sendMessage(message)
      .then(() => {
        this.toatr.success('message sent!');
      })
      .catch((err) => {
        this.toatr.error(err);
      })
      .finally(() => {
        this.message$ = '';
        this.selectedConvo$ = this.messages$[0];
      });
  }

  getLastMessages(message: Messages[]): Messages | null {
    if (message.length === 0) {
      return null;
    }
    return message[message.length - 1];
  }

  formatTimestamp(timestamp: Timestamp | null) {
    return formatTimeDifference(timestamp);
  }
}
