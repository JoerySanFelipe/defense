import {
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';
import { NavigationExtras, Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { Audit } from 'src/app/models/audit/audit';
import { Products } from 'src/app/models/products';
import { AuditLogService } from 'src/app/services/audit-log.service';
import { CompanyInfoService } from 'src/app/services/reportgen/company-info/company-info.service';

import { formatTimestamp } from 'src/app/utils/constants';
import { ExcelExportService } from 'src/app/services/reportgen/audit/excel-export.service';
import { PdfExportService } from 'src/app/services/reportgen/audit/pdf-export.service';
@Component({
  selector: 'app-product-adjustments',
  templateUrl: './product-adjustments.component.html',
  styleUrls: ['./product-adjustments.component.css'],
})
export class ProductAdjustmentsComponent {
  @Input() product!: Products;

  filteredAudits$: Audit[] = [];

  audits$: Audit[] = [];
  constructor(
    private auditService: AuditLogService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private pdfExportService: PdfExportService,
    private excelExportService: ExcelExportService
  ) {}

  ngOnInit(): void {
    this.auditService
      .getProductAdjustMents(this.product.id)
      .subscribe((data) => {
        this.audits$ = data;
        this.filteredAudits$ = this.audits$;
      });
  }

  formatTimeStamp(timestamp: Date) {
    return formatTimestamp(timestamp);
  }

  viewAudit(audit: Audit) {
    this.router.navigate(['admin/view-audit', audit.id]);
  }

  searchText = '';
  search() {
    this.filteredAudits$ = [...this.audits$];
    this.filteredAudits$ = this.filteredAudits$.filter((p) => {
      let input = this.searchText.toLowerCase();

      return p.id.includes(input);
    });
  }

  exportToExcel(): void {
    const filename = 'audit-report'; // Provide a filename here
    const companyInfo = new CompanyInfoService(); // Create an instance of CompanyInfoService
    const excelService = new ExcelExportService(companyInfo); // Provide companyInfo

    excelService.exportToExcel(this.filteredAudits$, filename, companyInfo);
  }

  exportToPdf() {
    const filename = 'audit-report'; // You can customize the filename
    this.pdfExportService.exportToPdf(this.filteredAudits$, filename);
  }
}
