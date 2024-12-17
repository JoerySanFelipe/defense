import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';

import { Customers } from 'src/app/models/customers';
import { Messages, Role } from 'src/app/models/messages';
import { Users } from 'src/app/models/users';
import { MessagesService } from 'src/app/services/messages.service';

@Component({
  selector: 'app-conversation',
  templateUrl: './conversation.component.html',
  styleUrls: ['./conversation.component.css'],
})
export class ConversationComponent implements OnInit {
  @Input()
  convoID!: string;
  @Input()
  customer!: Customers;

  @Input()
  users!: Users;
  messages = [
    { text: 'Hello!', from: 'assistant' },
    { text: 'Hi there!', from: 'user' },
    { text: 'How can I help you today?', from: 'assistant' },
    { text: 'I have a question.', from: 'user' },
    { text: 'Hello!', from: 'assistant' },
    { text: 'Hi there!', from: 'user' },
    { text: 'How can I help you today?', from: 'assistant' },
    { text: 'I have a question.', from: 'user' },
    { text: 'Hello!', from: 'assistant' },
    { text: 'Hi there!', from: 'user' },
    { text: 'How can I help you today?', from: 'assistant' },
    { text: 'I have a question.', from: 'user' },
    { text: 'Hello!', from: 'assistant' },
    { text: 'Hi there!', from: 'user' },
    { text: 'How can I help you today?', from: 'assistant' },
    { text: 'I have a question.', from: 'user' },
    { text: 'Hello!', from: 'assistant' },
    { text: 'Hi there!', from: 'user' },
    { text: 'How can I help you today?', from: 'assistant' },
    { text: 'I have a question.', from: 'user' },
    { text: 'Hello!', from: 'assistant' },
    { text: 'Hi there!', from: 'user' },
    { text: 'How can I help you today?', from: 'assistant' },
    { text: 'I have a question.', from: 'user' },
    { text: 'Hello!', from: 'assistant' },
    { text: 'Hi there!', from: 'user' },
    { text: 'How can I help you today?', from: 'assistant' },
    { text: 'I have a question.', from: 'user' },
    { text: 'Hello!', from: 'assistant' },
    { text: 'Hi there!', from: 'user' },
    { text: 'How can I help you today?', from: 'assistant' },
    { text: 'I have a question.', from: 'user' },
    // Add more messages as needed
  ];
  $messages: Messages[] = [];

  messageInput: string = '';
  constructor(private messagesService: MessagesService) {
    // this.listen(this.convoID);
  }
  ngOnInit(): void {}

  listen(convo: string) {
    this.messagesService.getAllConversationByID(convo).subscribe((data) => {
      this.$messages = data;
    });
  }
  sendMessage() {}
}
