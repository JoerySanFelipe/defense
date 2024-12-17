import { Order, Products, productToOrder } from '../models/products';

export class ProductCalculator {
  products: Products[];
  constructor(products: Products[]) {
    this.products = products;
  }

  getTotalProductCosts(): number {
    let totalCost = 0;

    this.products.forEach((product) => {
      if (product.variations.length === 0) {
        // If no variations, add the cost of the product
        totalCost += product.stocks * product.cost;
      } else {
        // If variations exist, add the cost of each variation
        product.variations.forEach((variation) => {
          totalCost += variation.stocks * variation.cost;
        });
      }
    });

    return totalCost;
  }

  countCategories(): number {
    const categories = new Set();
    this.products.forEach((value) => {
      categories.add(value.category.toLocaleLowerCase());
    });
    return categories.size;
  }

  getTargetStocksPerMonth(months: string[]): number[] {
    let targetSales: number[] = [];
    months.forEach((value) => {
      targetSales.push(this.getTargetSalesPerMoth(value));
    });

    return targetSales;
  }

  getTargetSalesPerMoth(month: string) {
    let count = 0;
    const currentYear = new Date().getFullYear();
    this.products.forEach((data) => {
      const monthYear = data.createdAt.toLocaleString('default', {
        month: 'short',
      });

      if (monthYear === month && data.createdAt.getFullYear() === currentYear) {
        if (data.variations.length === 0) {
          count += data.stocks * data.price;
        } else {
          data.variations.forEach((e) => {
            count += e.stocks * e.price;
          });
        }
      }
    });
    return count;
  }

  getTotalPurchases() {
    let totalPurchase = 0;
    this.products.map((e) => {
      if (e.variations.length == 0) {
        totalPurchase += e.stocks * e.cost;
      } else {
        e.variations.map((variation) => {
          totalPurchase += variation.stocks * variation.cost;
        });
      }
    });
    return totalPurchase;
  }

  getTotalSalesValue() {
    let totalSales = 0;
    this.products.map((e) => {
      if (e.variations.length == 0) {
        totalSales += e.stocks * e.price;
      } else {
        e.variations.map((variation) => {
          totalSales += variation.stocks * variation.price;
        });
      }
    });
    return totalSales;
  }

  getTotalProductCount(): number {
    let totalCount = 0;

    this.products.forEach((product) => {
      if (product.variations.length === 0) {
        // Product has no variations, count as 1
        totalCount++;
      } else {
        // Product has variations, count each variation
        totalCount += product.variations.length;
      }
    });

    return totalCount;
  }

  getTotalPriceLast7Days(): number {
    const currentDate = new Date();
    const sevenDaysAgo = new Date(currentDate);
    sevenDaysAgo.setDate(currentDate.getDate() - 7);

    let totalPrice = 0;

    this.products.forEach((product) => {
      if (
        product.createdAt >= sevenDaysAgo &&
        product.createdAt <= currentDate
      ) {
        if (product.variations.length === 0) {
          totalPrice += product.stocks * product.price;
        } else {
          product.variations.forEach((variation) => {
            totalPrice += variation.stocks * variation.price;
          });
        }
      }
    });

    return totalPrice;
  }

  countProductsLessThan20(): number {
    return this.products.reduce((count, product) => {
      if (product.variations.length === 0) {
        if (product.stocks < 20) {
          count++;
        }
      } else {
        const variationStocks = product.variations.reduce(
          (total, variation) => total + variation.stocks,
          0
        );
        if (variationStocks < 20) {
          count++;
        }
      }
      return count;
    }, 0);
  }

  countProductsBelowStockAlert(): number {
    return this.products.reduce((count, product) => {
      if (product.variations.length === 0) {
        // Check product stock against stockAlert
        if (product.stocks < product.stockAlert) {
          count++;
        }
      } else {
        // Check variations' combined stock against stockAlert
        const variationBelowAlert = product.variations.some(
          (variation) => variation.stocks < variation.stockAlert
        );
        if (variationBelowAlert) {
          count++;
        }
      }
      return count;
    }, 0);
  }  

  countProductsNoStocks(): number {
    return this.products.reduce((count, product) => {
      if (product.variations.length === 0) {
        // Count product without variations if stocks are zero
        if (product.stocks === 0) {
          count++;
        }
      } else {
        // Count variations with zero stock
        const variationsOutOfStock = product.variations.filter(
          (variation) => variation.stocks === 0
        ).length;
        
        if (variationsOutOfStock > 0) {
          count++;
        }
      }
      return count;
    }, 0);
  }  

  // Added Method
  getCountOfProductsLast7Days(): number {
    const currentDate = new Date();
    const sevenDaysAgo = new Date(currentDate);
    sevenDaysAgo.setDate(currentDate.getDate() - 7);

    let totalCount = 0;

    this.products.forEach((product) => {
      if (
        product.createdAt >= sevenDaysAgo &&
        product.createdAt <= currentDate
      ) {
        totalCount++;
      }
    });

    return totalCount;
  }

  countInStockProducts(): number {
    const currentDate = new Date();
    return this.products.reduce((count, product) => {
      if (product.variations.length === 0) {
        if (
          product.stocks > 20 &&
          product.expiryDate && // Check if expiryDate is not null
          product.expiryDate.getTime() > currentDate.getTime()
        ) {
          count++;
        }
      } else {
        const variationStocks = product.variations.reduce(
          (total, variation) => total + variation.stocks,
          0
        );
        if (
          variationStocks > 20 &&
          product.expiryDate && // Check if expiryDate is not null
          product.expiryDate.getTime() > currentDate.getTime()
        ) {
          count++;
        }
      }
      return count;
    }, 0);
  }

  countToBeExpiredProducts(): number {
    const currentDate = new Date();
    const sixtyDaysLater = new Date(
      currentDate.getTime() + 60 * 24 * 60 * 60 * 1000
    ); // 60 days from now
    return this.products.reduce((count, product) => {
      if (product.expiryDate) {
        const expirationDate = new Date(product.expiryDate);
        if (expirationDate <= sixtyDaysLater && expirationDate > currentDate) {
          count++;
        }
      }
      return count;
    }, 0);
  }

  countExpiredProducts(): number {
    const currentDate = new Date();

    return this.products.reduce((count, product) => {
      if (product.expiryDate) {
        const expirationDate = new Date(product.expiryDate);
        if (expirationDate < currentDate) {
          count++;
        }
      }
      return count;
    }, 0);
  }
  // END of added Method
}
