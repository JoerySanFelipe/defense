import { Observable } from 'rxjs';
import { Customers } from './customers';
import { Messages } from './messages';
import { Users } from './users';

export interface UserWithMessages {
  customers: Customers;
  messages: Messages[];
}
