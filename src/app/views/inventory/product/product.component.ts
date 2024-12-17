import { Component, OnDestroy, OnInit } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';
import { NavigationExtras, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subscription, map } from 'rxjs';

import { Products } from 'src/app/models/products';
import { Users } from 'src/app/models/users';
import { Variation } from 'src/app/models/variation';
import { AuthService } from 'src/app/services/auth.service';
import { DateConverterService } from 'src/app/services/date-converter.service';
import { LoadingService } from 'src/app/services/loading.service';

import { ProductService } from 'src/app/services/product.service';
import { CompanyInfoService } from 'src/app/services/reportgen/company-info/company-info.service';
import { ExcelExportService } from 'src/app/services/reportgen/product/excel-export.service';
import { PdfExportService } from 'src/app/services/reportgen/product/pdf-export.service';

import { formatPrice } from 'src/app/utils/constants';
import { ProductCalculator } from 'src/app/utils/product_calc';

import * as echarts from 'echarts'; // added ECharts run on terminal "npm install echarts --save"

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css'],
})
export class ProductComponent implements OnInit, OnDestroy {
  _products!: Observable<Products[]>;

  _selectedProduct: Products | null = null;
  _PRODUCTS: Products[] = [];
  productCalculator: ProductCalculator;
  users$: Users | null = null;

  filteredProducts: Products[] = [];
  filter: string = '';

  page = 1;
  pageSize = 0;
  collectionSize = 0;
  searchText = '';

  private subscriptions: Subscription = new Subscription();

  search() {
    this.filteredProducts = [];
    // Iterate through each product
    this._PRODUCTS.forEach((p) => {
      let input = this.searchText.toLowerCase();
      let name = p.name.toLowerCase();
      let category = p.category.toLowerCase();
  
      // Check if the product name or category matches the search text
      if (name.includes(input) || category.includes(input)) {
        this.filteredProducts.push(p);  // If there's a match, add the whole product
      }
  
      // Additionally, check if any variation matches the search text
      if (p.variations) {
        const matchingVariations = p.variations.filter((variation) => {
          let variationName = variation.name.toLowerCase();
          return variationName.includes(input);
        });
  
        // If matching variations are found, include the product with only those variations
        if (matchingVariations.length > 0) {
          this.filteredProducts.push({
            ...p,
            variations: matchingVariations,
          });
        }
      }
    });
  }   
  
  constructor(
    private productService: ProductService,
    public dateService: DateConverterService,
    private toastr: ToastrService,
    private router: Router,
    public loadingService: LoadingService,
    public authService: AuthService,
    private companyInfoService: CompanyInfoService,
    private pdfExportService: PdfExportService,
    private excelExportService: ExcelExportService
  ) {
    this.productCalculator = new ProductCalculator([]);
    authService.users$.subscribe((data) => {
      this.users$ = data;
    });
  }

  private initializeProducts(): void {
    this.productService.getAllProducts().subscribe((data: Products[]) => {
      console.log(data);
      this.productService.setProduct(data);
      this._PRODUCTS = data;
      this.collectionSize = data.length;
      this.filteredProducts = data;
      this.productCalculator = new ProductCalculator(this._PRODUCTS);

      this.renderProductAvailabilityChart();
      this.renderProductCategoryQuantity();
    });
  }
  computeStocksPerCategory(category: string): number {
    let total = 0;
    this._PRODUCTS.map((e) => {
      if (e.category == category) {
        total += this.countStocks(e);
      }
    });

    return total;
  }

  //changed to  pie chart
  renderProductCategoryQuantity() {
    const chartElement = document.getElementById('category-stocks');
    const chart = echarts.init(chartElement);

    const categories = Array.from(
      new Set(this._PRODUCTS.map((e) => e.category))
    );
    const quantities = categories.map((category) =>
      this.computeStocksPerCategory(category)
    );

    const option = {
      title: {
        text: '',
        left: 'center',
      },
      tooltip: {
        trigger: 'item',
      },
      legend: {
        orient: 'horizontal',
        bottom: 'bottom',
        data: categories,
      },
      series: [
        {
          name: 'Stocks',
          type: 'pie',
          radius: ['25%', '80%'],
          center: ['50%', '50%'],
          data: categories.map((category, index) => ({
            name: category,
            value: quantities[index],
          })),
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ],
    };
    chart.setOption(option);
  }

  sortFilteredProducts(): void {
    this.filteredProducts.sort((a, b) => {
      // Get valid Date objects, use current date if missing
      const aDate = a.updatedAt ? new Date(a.updatedAt) : (a.createdAt ? new Date(a.createdAt) : new Date());
      const bDate = b.updatedAt ? new Date(b.updatedAt) : (b.createdAt ? new Date(b.createdAt) : new Date());
      
      // If both products have no updatedAt or createdAt dates, fallback to current date
      if (aDate.getTime() === bDate.getTime()) {
        return 0; // They are equal, so no need to change the order
      }
      
      // Otherwise, compare by date in descending order
      return bDate.getTime() - aDate.getTime();
    });
  }
  
  //end of refactor

  ngOnInit(): void {
    // Initialize products and fetch data
    this.initializeProducts();

    // Subscribe to user data
    const userSub = this.authService.users$.subscribe((data) => {
      this.users$ = data;
    });
    this.subscriptions.add(userSub);

    // After initializing, refresh and sort the filtered products
    this.refreshProducts();
    this.sortFilteredProducts();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();  // Properly unsubscribe from all subscriptions
  }
  

  applyFilter(selectedFilter: string) {
    this.filter = selectedFilter;
    this.filterProducts();
  }

  filterProducts() {
    const filteredItems: any[] = [];
    const currentDate = new Date();
  
    this._PRODUCTS.forEach((product) => {
      const matchingVariations: Variation[] = [];
  
      product.variations.forEach((variation) => {
        switch (this.filter) {
          case 'inStock':
            // Check if variation stock is greater than stockAlert
            if (variation.stocks > (variation.stockAlert || 0)) {
              matchingVariations.push(variation);
            }
            break;
  
          case 'lowStock':
            // Check if variation stock is less than or equal to stockAlert but not zero
            if (variation.stocks > 0 && variation.stocks <= (variation.stockAlert || 0)) {
              matchingVariations.push(variation);
            }
            break;
  
          case 'outOfStock':
            // Check if variation stock is zero
            if (variation.stocks === 0) {
              matchingVariations.push(variation);
            }
            break;
  
          case 'toBeExpired':
            // Check if the product has an expiry date and is within 60 days from today
            const thresholdDate = new Date(currentDate.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days from today
            if (
              product.expiryDate &&
              new Date(product.expiryDate).getTime() <= thresholdDate.getTime() &&
              new Date(product.expiryDate).getTime() >= currentDate.getTime()
            ) {
              matchingVariations.push(variation);
            }
            break;
  
          case 'expired':
            // Check if the product is expired (expiry date is less than current date)
            if (product.expiryDate && new Date(product.expiryDate).getTime() < currentDate.getTime()) {
              matchingVariations.push(variation);
            }
            break;
  
          default:
            matchingVariations.push(variation);
            break;
        }
      });
  
      // Only add products with matching variations
      if (matchingVariations.length > 0) {
        filteredItems.push({
          ...product,
          variations: matchingVariations, // Only include matching variations
        });
      } else if (product.variations.length === 0) {
        // If no variations, check if the product itself matches the filter
        if (this.isProductMatchingFilter(product)) {
          filteredItems.push({ ...product, variations: [] });
        }
      }
    });
  
    // Update the filtered products list
    this.filteredProducts = filteredItems;
  }
  
// Helper function to check filters for products without variations
isProductMatchingFilter(product: Products): boolean {
  const currentDate = new Date();

  switch (this.filter) {
    case 'inStock':
      // Check if the total stock of the product is greater than stockAlert
      return this.countStocks(product) > (product.stockAlert || 0);

    case 'lowStock':
      // Check if the total stock of the product is less than or equal to stockAlert but greater than 0
      return this.countStocks(product) > 0 && this.countStocks(product) <= (product.stockAlert || 0);

    case 'outOfStock':
      // Check if the total stock of the product is 0
      return this.countStocks(product) === 0;

    case 'toBeExpired':
      // Check if the product has an expiry date and it is within 60 days from today
      const thresholdDate = new Date(currentDate.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days from today
      return (
        product.expiryDate !== null && // Ensure expiryDate exists
        new Date(product.expiryDate).getTime() <= thresholdDate.getTime() &&
        new Date(product.expiryDate).getTime() >= currentDate.getTime()
      );

    case 'expired':
      // Check if the product is expired
      return (
        product.expiryDate !== null && // Ensure expiryDate exists
        new Date(product.expiryDate).getTime() < currentDate.getTime()
      );

    default:
      return true; // Return true if no filter is applied
  }
}
 
  
  

  exportToPdf(): void {
    if (this.users$) {
      this.pdfExportService.exportProductsToPdf(this.filteredProducts, this.users$);
    } else {
      this.toastr.error('User information is not available.');
    }
  }
  
  exportToExcel() {
    const filename = 'products-report';

    // Pass the companyInfoService directly to the exportToExcel method
    this.excelExportService.exportToExcel(this.filteredProducts, filename, this.companyInfoService)
      .then(() => {
        console.log('Report generated successfully');
      })
      .catch(error => {
        console.error('Error generating report:', error);
      });
  }

  convertTimestamp(timestamp: any) {
    const date = new Date(
      timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000
    );
    return date.toLocaleDateString();
  }
  selectedProduct(index: number) {
    console.log(index);
    if (this._PRODUCTS && index >= 0 && index < this._PRODUCTS.length) {
      this._selectedProduct = this._PRODUCTS[index];
    } else {
      this._selectedProduct = null;
    }
  }

  findHighestLowestPrice(variations: Variation[]): string {
    let arr = variations.map((data) => data.price);
    if (arr.length === 0) {
      throw new Error('Array is empty.');
    }
    const highest = Math.max(...arr);
    const lowest = Math.min(...arr);

    const highestFormatted = highest.toLocaleString('en-US', {
      style: 'currency',
      currency: 'PHP',
    });
    const lowestFormatted = lowest.toLocaleString('en-US', {
      style: 'currency',
      currency: 'PHP',
    });

    return ` ${lowestFormatted} - ${highestFormatted}`;
  }
  countStocks(product: Products): number {
    let count = 0;
    if (product.variations.length === 0) {
      return product.stocks;
    }
    product.variations.map((data) => (count += data.stocks));
    return count;
  }

  viewProduct(product: Products) {
    this.router.navigate([this.users$?.type + '/view-product', product.id]);
    // navigationExtras
  }

  formatPHP(num: number) {
    return formatPrice(num);
  }
  getUserType() {
    if (this.users$?.type === 'staff') {
      return 'staff';
    }
    return 'admin';
  }

  displayExpiryDate(expiryDate: Date): string {
    if (!expiryDate) {
      return 'Non-Expiring';  // Return a placeholder if expiryDate is missing
    }
  
    const currentDate = new Date();
    const oneWeek = 60 * 24 * 60 * 60 * 1000; // 2 months or 60 days instead of 1 week
  
    if (expiryDate.getTime() >= currentDate.getTime()) {
      const timeDiff = expiryDate.getTime() - currentDate.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
      if (daysDiff <= 0) {
        return 'Exceeded';
      } else if (daysDiff <= 60) {
        return `${daysDiff} day${daysDiff === 1 ? '' : 's'} left`;
      } else {
        const month = expiryDate.getMonth() + 1;
        const day = expiryDate.getDate();
        const year = expiryDate.getFullYear();
        return `${month}/${day}/${year}`;
      }
    } else {
      return 'Exceeded';
    }
  }  

  refreshProducts() {
    this.filteredProducts = [];
    const filteredItems: any[] = [];
  
    // Filter logic
    this._PRODUCTS.forEach((p) => {
      let input = this.searchText.toLowerCase();
      let name = p.name.toLowerCase();
      let category = p.category.toLowerCase();
  
      let isProductMatched = name.includes(input) || category.includes(input);
      let matchingVariations: any[] = [];
  
      if (p.variations) {
        matchingVariations = p.variations.filter((variation) => {
          let variationName = variation.name.toLowerCase();
          return variationName.includes(input);
        });
      }
  
      // Handle filter based on expiryDate if relevant
      if (this.filter === 'expired' || this.filter === 'toBeExpired') {
        const currentDate = new Date();
        
        if (p.expiryDate) {
          const expiryDate = new Date(p.expiryDate);
          
          // Apply the logic to filter based on expiration date
          if (
            (this.filter === 'expired' && expiryDate.getTime() < currentDate.getTime()) ||
            (this.filter === 'toBeExpired' && expiryDate.getTime() <= currentDate.getTime() + 60 * 24 * 60 * 60 * 1000) // 60 days
          ) {
            matchingVariations = p.variations.filter(variation => variation.stocks > 0); // Show variations in stock
          }
        } else {
          if (this.filter === 'expired') {
            matchingVariations = []; // No expiry date, so don't show
          }
        }
      }
  
      // Add matching variations to filtered items
      if (matchingVariations.length > 0) {
        matchingVariations.forEach(variation => {
          filteredItems.push({
            ...p,
            variations: [variation]
          });
        });
      } else if (isProductMatched && p.variations.length === 0) {
        filteredItems.push({
          ...p,
          variations: []
        });
      }
    });
  
    // Apply sorting after filtering
    this.filteredProducts = filteredItems;
  
    // Optionally, handle pagination here
    this.collectionSize = this.filteredProducts.length;
    if (this.pageSize === 0) {
      this.pageSize = this.filteredProducts.length;
    } else {
      const startIndex = (this.page - 1) * this.pageSize;
      const endIndex = startIndex + this.pageSize;
      this.filteredProducts = this.filteredProducts.slice(startIndex, endIndex);
    }
  }  
  

  //added codes
  isExpired(product: Products): boolean {
    if (!product.expiryDate) {
      // If expiryDate is null or undefined, consider the product as not expired.
      return false;
    }
  
    const currentDate: Date = new Date();
    return product.expiryDate.getTime() < currentDate.getTime();
  }
  
  isToBeExpired(product: any): boolean {
    const currentDate = new Date();
    
    if (!product.expiryDate) {
      // If expiryDate is null or undefined, consider the product as not to be expired.
      return false;
    }
  
    const thresholdDate = new Date(
      currentDate.getTime() + 60 * 24 * 60 * 60 * 1000 // 60 days from now
    );
    
    return (
      product.expiryDate.getTime() <= thresholdDate.getTime() &&
      product.expiryDate.getTime() >= currentDate.getTime()
    );
  }
  

  // added chart product availability
  renderProductAvailabilityChart(): void {
    const chartElement = document.getElementById('product-availability');
    const chart = echarts.init(chartElement);

    const categories = [
      'In stock',
      'Low in stock',
      'Out of stock',
      'To expire',
      'Expired',
    ];
    const quantities = [
      this.productCalculator.countInStockProducts(),
      this._PRODUCTS.filter(
        (product) => product.stocks < product.stockAlert && product.stocks > 0
      ).length,
      this.productCalculator.countProductsNoStocks(),
      this.productCalculator.countToBeExpiredProducts(),
      this.productCalculator.countExpiredProducts(),
    ];

    const option = {
      title: {
        text: '',
        left: 'center',
      },
      tooltip: {
        trigger: 'item',
      },
      legend: {
        orient: 'horizontal',
        bottom: 'bottom',
        data: categories,
      },
      series: [
        {
          name: 'Availability',
          type: 'pie',
          radius: ['25%', '80%'],
          center: ['50%', '50%'],
          data: categories.map((category, index) => ({
            value: quantities[index],
            name: category,
          })),
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      ],
    };
    chart.setOption(option);
  }
}
