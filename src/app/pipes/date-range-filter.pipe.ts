import { Pipe, PipeTransform } from '@angular/core';
import { Transactions } from 'src/app/models/transaction/transactions';

@Pipe({
  name: 'dateRangeFilter'
})
export class DateRangeFilterPipe implements PipeTransform {

  transform(transactions: Transactions[], startDate: string, endDate: string): Transactions[] {
    if (!transactions || (!startDate && !endDate)) {
      return transactions;
    }

    // Adjust startDate and endDate to cover full day range
    const adjustedStartDate = startDate ? new Date(startDate + 'T00:00:00') : null;
    const adjustedEndDate = endDate ? new Date(endDate + 'T23:59:59') : null;

    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.createdAt);
      const matchesStartDate = adjustedStartDate ? transactionDate >= adjustedStartDate : true;
      const matchesEndDate = adjustedEndDate ? transactionDate <= adjustedEndDate : true;

      return matchesStartDate && matchesEndDate;
    });
  }
}
