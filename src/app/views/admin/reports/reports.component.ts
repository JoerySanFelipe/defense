import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Order, Products, productToOrder } from 'src/app/models/products';
import { OrderItems } from 'src/app/models/transaction/order_items';
import { Transactions } from 'src/app/models/transaction/transactions';
import { LoadingService } from 'src/app/services/loading.service';
import { ProductService } from 'src/app/services/product.service';
import { TransactionsService } from 'src/app/services/transactions.service';
import { formatPrice, months } from 'src/app/utils/constants';
import { ProductCalculator } from 'src/app/utils/product_calc';
import { TransactionCalculator } from 'src/app/utils/transaction_calc';
import * as echarts from 'echarts'; // added ECharts run on terminal "npm install echarts --save"
import { Users } from 'src/app/models/users';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';

export interface BestSellingCategories {
  category: string;
  totalSales: number;
}
@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
})
export class ReportsComponent implements OnInit {
  _topSellingCategories: BestSellingCategories[] = [];
  _transactionCalculator: TransactionCalculator = new TransactionCalculator([]);
  _productCalculator: ProductCalculator = new ProductCalculator([]);
  _productList: Products[] = [];
  _lowStocks: Order[] = [];
  _productItemList: Order[] = [];
  _transactionList: Transactions[] = [];

  users$: Users | null = null;
  public barChartOptions = {
    responsive: true,
  };
  public barChartLabels: string[] = [];
  public barChartType: string = 'bar';
  public barChartLegend: boolean = true;

  public barChartData = [
    // changed colors of data bars
    {
      data: [10000, 20000, 30000, 40000, 50000, 60000],
      label: 'Sales',
      backgroundColor: '#91cc75',
      hoverBackgroundColor: '#91cc75',
    },
    {
      data: [10000, 20000, 30000, 40000, 50000, 60000],
      label: 'Revenue',
      backgroundColor: '#fac858',
      hoverBackgroundColor: '#fac858',
    },
  ];

  constructor(
    private transactionService: TransactionsService,
    private loadingService: LoadingService,
    private cdr: ChangeDetectorRef,
    private productService: ProductService,
    private authService: AuthService,
    private router: Router
  ) {
    authService.users$.subscribe((data) => {
      this.users$ = data;
    });
  }
  ngOnInit(): void {
    this.productService.getAllProducts().subscribe((data: Products[]) => {
      this._productList = data;
      this._productCalculator = new ProductCalculator(data);
      this._productList.map((product) => {
        this._productItemList.push(...productToOrder(product));
        this._productItemList.sort((a, b) => a.stocks - b.stocks);
        this._lowStocks = this._productItemList.slice(0, 5);
      });

      this.cdr.detectChanges();
    });
    this.transactionService
      .getTransactionsForCurrentYear()
      .subscribe((data) => {
        this._transactionList = data;
        this._transactionCalculator = new TransactionCalculator(data);
        this.barChartLabels = months;
        this.barChartData[0].data =
          this._transactionCalculator.generateTotalSalesPerMoth(months);

        this.renderFastMovingProductsChart(); //Added - Joery

        console.log('Transactions', this.barChartData[0]);
        this.barChartData[1].data =
          this._transactionCalculator.generateRevenuePerMonth(months);

        console.log('Revenue', this.barChartData[1]);
        this.cdr.detectChanges();
      });
  }

  formatPrice(num: number) {
    return formatPrice(num);
  }

  getProduct(productID: string) {
    const product = this._productList.find(
      (product) => product.id === productID
    );
    if (product) {
      return product;
    } else {
      return null;
    }
  }

  countRemaining(name: string, items: Order[]): number {
    let count = 0;
    items.map((data) => {
      if (name == data.name) {
        count += data.stocks;
      }
    });
    return count;
  }
  getBestSellingCategories() {
    let categories = new Set(
      this._productList.map((e) => e.category.toLocaleLowerCase())
    );
  }

  //Added Code
  renderFastMovingProductsChart(): void {
    const chartElement = document.getElementById('fastMovingProductsChart');

    if (!chartElement) {
      console.log('fastMovingProductsChart not found.');
      return;
    }

    const chart = echarts.init(chartElement);
    const fastMovingProducts =
      this._transactionCalculator.calculateTopSellingStocks();

    const productNames = fastMovingProducts.map((product) => product.name);
    const seriesData = fastMovingProducts.map((product) => ({
      value: product.price * product.soldQuantity,
      extraData: product.soldQuantity,
      name: product.name,
    }));
    console.log('Test', seriesData);

    const currentDate = new Date();
    const currentMonthName = currentDate.toLocaleString('default', {
      month: 'long',
    });

    const option = {
      title: {
        text: '',
        subtext: `Month: ${currentMonthName}`,
        left: 'left',
      },
      tooltip: {
        trigger: 'item',
        formatter:
          '<b>{a}:</b> {c} <br/> <b>Product Name:</b> {b} <br/> <b>Quantity Sold:</b> {d} ',
      },
      legend: {
        orient: 'horizontal',
        bottom: 'bottom',
        data: productNames,
      },
      series: [
        {
          name: 'Sales Made',
          type: 'pie',
          radius: ['25%', '80%'],
          center: ['50%', '50%'],
          data: seriesData,
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

  viewProduct(id: string) {
    this.router.navigate([this.users$?.type + '/view-product', id]);
  }
}
