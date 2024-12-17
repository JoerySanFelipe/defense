import { Timestamp } from '@angular/fire/firestore';

export interface TransactionSchedule {
  startDate: Timestamp;
  endDate: Timestamp;
}
