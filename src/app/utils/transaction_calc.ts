import { or } from '@angular/fire/firestore';
import { TopSellingStock } from '../models/top_selling_stock';
import { OrderItems } from '../models/transaction/order_items';
import { Transactions } from '../models/transaction/transactions';
import { TransactionStatus } from '../models/transaction/transaction_status';
import { TransactionType } from '../models/transaction/transaction_type';
import { Products } from '../models/products';
import { BestSellingCategories } from '../views/admin/reports/reports.component';

export class TransactionCalculator {
  transactions: Transactions[];
  constructor(transactions: Transactions[]) {
    this.transactions = transactions;
  }

  calculateTotalSales(): number {
    let totalSales = 0;
    for (const transaction of this.transactions.filter(
      (e) => e.status == TransactionStatus.COMPLETED
    )) {
      for (const orderItem of transaction.orderList) {
        totalSales += orderItem.quantity * orderItem.price;
      }
    }
    return totalSales;
  }

  calculateTotalRevenue(): number {
    return this.transactions.reduce((sum, transaction) => {
      return sum + (transaction.payment?.amount || 0);
    }, 0);
  }

  calculateTotalCost(): number {
    let totalCost = 0;
    for (const transaction of this.transactions.filter(
      (e) => e.status == TransactionStatus.COMPLETED
    )) {
      for (const orderItem of transaction.orderList) {
        totalCost += orderItem.quantity * orderItem.cost;
      }
    }
    return totalCost;
  }

  calculateTopSellingStocks(): TopSellingStock[] {
    const orderList: OrderItems[] = this.transactions
      .filter((e) => e.status == TransactionStatus.COMPLETED)
      .flatMap((transaction) => transaction.orderList);
    const topSellingStockMap = new Map<string, TopSellingStock>();
    for (const orderItem of orderList) {
      const { productID, productName, quantity, price } = orderItem;

      if (topSellingStockMap.has(productName)) {
        const existingStock = topSellingStockMap.get(productName)!;
        existingStock.soldQuantity += quantity;
        existingStock.stocks += quantity;
      } else {
        topSellingStockMap.set(productName, {
          id: productID,
          name: productName,
          soldQuantity: quantity,
          stocks: quantity,
          price: price,
        });
      }
    }

    const topSellingStocks: TopSellingStock[] = Array.from(
      topSellingStockMap.values()
    ).sort((a, b) => b.soldQuantity - a.soldQuantity);
    const top3SellingStocks = topSellingStocks.slice(0, 5); // top 5 nalang
    return top3SellingStocks;
  }

  calculateTotalSalesPerMonth(): Map<string, number> {
    const totalSalesPerMonth = new Map<string, number>();
    const currentYear = new Date().getFullYear();
    for (const transaction of this.transactions.filter(
      (e) =>
        e.status == TransactionStatus.COMPLETED &&
        e.createdAt.getFullYear() === currentYear
    )) {
      const monthYear = transaction.createdAt.toLocaleString('default', {
        month: 'short',
      });

      const totalSales = transaction.orderList.reduce((total, orderItem) => {
        return total + orderItem.quantity * orderItem.price;
      }, 0);

      if (totalSalesPerMonth.has(monthYear)) {
        totalSalesPerMonth.set(
          monthYear,
          totalSalesPerMonth.get(monthYear)! + totalSales
        );
      } else {
        totalSalesPerMonth.set(monthYear, totalSales);
      }
    }
    return totalSalesPerMonth;
  }

  calculateTotalCostPerMonth(): Map<string, number> {
    const totalSalesPerMonth = new Map<string, number>();
    const currentYear = new Date().getFullYear();
    for (const transaction of this.transactions.filter(
      (e) =>
        e.status == TransactionStatus.COMPLETED &&
        e.createdAt.getFullYear() === currentYear
    )) {
      const monthYear = transaction.createdAt.toLocaleString('default', {
        month: 'short',
      });

      const totalSales = transaction.orderList.reduce((total, orderItem) => {
        return total + orderItem.quantity * orderItem.cost;
      }, 0);

      if (totalSalesPerMonth.has(monthYear)) {
        totalSalesPerMonth.set(
          monthYear,
          totalSalesPerMonth.get(monthYear)! + totalSales
        );
      } else {
        totalSalesPerMonth.set(monthYear, totalSales);
      }
    }
    return totalSalesPerMonth;
  }

  generateTotalSalesPerMoth(months: string[]): number[] {
    let targetSales: number[] = [];
    months.forEach((data) => {
      let total: number = this.calculateTotalSalesPerMonth().get(data) ?? 0;
      targetSales.push(total);
    });

    return targetSales;
  }

  generateRevenuePerMonth(months: string[]): number[] {
    let targetSales: number[] = [];
    months.forEach((data) => {
      let sales: number = this.calculateTotalSalesPerMonth().get(data) ?? 0;
      let cost: number = this.calculateTotalCostPerMonth().get(data) ?? 0;
      targetSales.push(sales - cost);
    });
    return targetSales;
  }

  calculateTotalSalesByWalkIn(): Map<string, number> {
    const totalSalesPerMonth = new Map<string, number>();
    const currentYear = new Date().getFullYear();

    for (const transaction of this.transactions.filter(
      (e) =>
        e.status == TransactionStatus.COMPLETED &&
        e.type == TransactionType.WALK_IN &&
        e.createdAt.getFullYear() === currentYear
    )) {
      const monthYear = transaction.createdAt.toLocaleString('default', {
        month: 'short',
      });

      const totalSales = transaction.orderList.reduce((total, orderItem) => {
        return total + orderItem.quantity * orderItem.price;
      }, 0);

      if (totalSalesPerMonth.has(monthYear)) {
        totalSalesPerMonth.set(
          monthYear,
          totalSalesPerMonth.get(monthYear)! + totalSales
        );
      } else {
        totalSalesPerMonth.set(monthYear, totalSales);
      }
    }

    return totalSalesPerMonth;
  }

  calculateTotalOnlineOrders(): Map<string, number> {
    const totalSalesPerMonth = new Map<string, number>();
    const currentYear = new Date().getFullYear();

    for (const transaction of this.transactions.filter(
      (e) =>
        e.status == TransactionStatus.COMPLETED &&
        (e.type == TransactionType.DELIVERY ||
          e.type == TransactionType.PICK_UP) &&
        e.createdAt.getFullYear() === currentYear
    )) {
      const monthYear = transaction.createdAt.toLocaleString('default', {
        month: 'short',
      });

      const totalSales = transaction.orderList.reduce((total, orderItem) => {
        return total + orderItem.quantity * orderItem.price;
      }, 0);

      if (totalSalesPerMonth.has(monthYear)) {
        totalSalesPerMonth.set(
          monthYear,
          totalSalesPerMonth.get(monthYear)! + totalSales
        );
      } else {
        totalSalesPerMonth.set(monthYear, totalSales);
      }
    }
    return totalSalesPerMonth;
  }

  getAllActiveCustomer() {
    const uniqueCustomerIDs = new Set();
    this.transactions.forEach((e) => {
      if (e.customerID !== '') {
        uniqueCustomerIDs.add(e.customerID);
      }
    });
    return uniqueCustomerIDs.size;
  }

  countCancelledTransactions() {
    return this.transactions.filter(
      (e) => e.status == TransactionStatus.CANCELLED
    );
  }

  getCategorySales(
    transactions: Transactions[],
    products: Products[]
  ): BestSellingCategories[] {
    const productCategoryMap: { [productID: string]: string } = {};
    products.forEach((product) => {
      productCategoryMap[product.id] = product.category;
    });

    const categorySalesMap: { [category: string]: number } = {};
    transactions.forEach((transaction) => {
      transaction.orderList.forEach((orderItem: OrderItems) => {
        const productID = orderItem.productID;
        const category = productCategoryMap[productID];
        const quantity = orderItem.quantity;

        if (category) {
          categorySalesMap[category] =
            (categorySalesMap[category] || 0) + orderItem.price * quantity;
        }
      });
    });

    const categorySalesArray: BestSellingCategories[] = Object.entries(
      categorySalesMap
    ).map(([category, totalSales]) => ({ category, totalSales }));

    return categorySalesArray;
  }

  countTotalTransactionsLast7Days(): number {
    const currentDate = new Date();
    const sevenDaysAgo = new Date(currentDate);
    sevenDaysAgo.setDate(currentDate.getDate() - 7);

    return this.transactions.filter(
      (transaction) =>
        transaction.status === TransactionStatus.COMPLETED &&
        transaction.createdAt >= sevenDaysAgo &&
        transaction.createdAt <= currentDate
    ).length;
  }
  countCompletedTransactionsLast7Days(): number {
    const currentDate = new Date();
    const sevenDaysAgo = new Date(currentDate);
    sevenDaysAgo.setDate(currentDate.getDate() - 7);

    return this.transactions.filter(
      (transaction) =>
        transaction.status === TransactionStatus.COMPLETED &&
        transaction.createdAt >= sevenDaysAgo &&
        transaction.createdAt <= currentDate
    ).length;
  }
  sumTotalSalesCompleted7DaysAgo(): number {
    const currentDate = new Date();
    const sevenDaysAgo = new Date(currentDate);
    sevenDaysAgo.setDate(currentDate.getDate() - 7);

    return this.transactions
      .filter(
        (transaction) =>
          transaction.status === TransactionStatus.COMPLETED &&
          transaction.createdAt >= sevenDaysAgo &&
          transaction.createdAt < currentDate
      )
      .reduce((totalSales, transaction) => {
        const salesForTransaction = transaction.orderList.reduce(
          (subtotal, orderItem) =>
            subtotal + orderItem.quantity * orderItem.price,
          0
        );
        return totalSales + salesForTransaction;
      }, 0);
  }

  countAndSumFailedOrders7DaysAgo(): { count: number; totalAmount: number } {
    const currentDate = new Date();
    const sevenDaysAgo = new Date(currentDate);
    sevenDaysAgo.setDate(currentDate.getDate() - 7);

    const failedOrders = this.transactions.filter(
      (transaction) =>
        transaction.status === TransactionStatus.FAILED &&
        transaction.createdAt >= sevenDaysAgo &&
        transaction.createdAt < currentDate
    );

    const count = failedOrders.length;
    const totalAmount = failedOrders.reduce((total, transaction) => {
      return (
        total +
        transaction.orderList.reduce(
          (subtotal, orderItem) =>
            subtotal + orderItem.quantity * orderItem.price,
          0
        )
      );
    }, 0);

    return { count, totalAmount };
  }

  // // more efficient
  // calculateTotalSalesAndCostPerMonth(): [
  //   Map<string, number>,
  //   Map<string, number>
  // ] {
  //   const totalSalesPerMonth = new Map<string, number>();
  //   const totalCostPerMonth = new Map<string, number>();

  //   this.transactions.forEach((transaction) => {
  //     if (transaction.status === TransactionStatus.COMPLETED) {
  //       const createdAt = transaction.createdAt.toDate();
  //       const monthYear = createdAt.toLocaleString('default', {
  //         month: 'short',
  //         year: 'numeric',
  //       });

  //       const totalSales = transaction.orderList.reduce((total, orderItem) => {
  //         return total + orderItem.quantity * orderItem.price;
  //       }, 0);

  //       const totalCost = transaction.orderList.reduce((total, orderItem) => {
  //         return total + orderItem.quantity * orderItem.cost;
  //       }, 0);

  //       totalSalesPerMonth.set(
  //         monthYear,
  //         (totalSalesPerMonth.get(monthYear) || 0) + totalSales
  //       );
  //       totalCostPerMonth.set(
  //         monthYear,
  //         (totalCostPerMonth.get(monthYear) || 0) + totalCost
  //       );
  //     }
  //   });

  //   return [totalSalesPerMonth, totalCostPerMonth];
  // }

  // Start Added Method
  getFastMovingProducts(): {
    productName: string;
    quantitySold: number;
    totalSales: number;
  }[] {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const productsSold = new Map<
      string,
      { quantitySold: number; totalSales: number }
    >();

    const filteredTransactions = this.transactions.filter((transaction) => {
      const transactionDate = transaction.createdAt;
      return (
        transactionDate.getFullYear() === currentYear &&
        transactionDate.getMonth() === currentMonth
      );
    });

    filteredTransactions.forEach((transaction) => {
      transaction.orderList.forEach((orderItem) => {
        console.log('Quantity sold:', orderItem.quantity);
        const productId = orderItem.productID;
        const productPrice = orderItem.price;
        let productQuantitySold = orderItem.quantity;

        const totalSales = productPrice * productQuantitySold;

        if (productsSold.has(productId)) {
          const existingProduct = productsSold.get(productId)!;
          productsSold.set(productId, {
            quantitySold: existingProduct.quantitySold + productQuantitySold,
            totalSales: existingProduct.totalSales + totalSales,
          });
        } else {
          productsSold.set(productId, {
            quantitySold: productQuantitySold,
            totalSales,
          });
        }
      });
    });

    const sortedProducts = Array.from(productsSold.entries()).sort(
      (a, b) => b[1].quantitySold - a[1].quantitySold
    );

    const topFastMovingProducts = sortedProducts
      .slice(0, 5)
      .map(([productId, { quantitySold, totalSales }]) => {
        const parsedQuantitySold = quantitySold.toFixed(0);

        const orderItem = filteredTransactions
          .flatMap((transaction) => transaction.orderList)
          .find((item) => item.productID === productId);

        const productName = orderItem?.productName ?? '';
        return { productName, quantitySold, totalSales };
      });

    return topFastMovingProducts;
  }
  //END
}
