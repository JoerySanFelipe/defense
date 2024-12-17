import { Component, OnInit } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';
import { NavigationExtras, Router } from '@angular/router';
import { Audit } from 'src/app/models/audit/audit';
import { AuditLogService } from 'src/app/services/audit-log.service';
import { ExcelExportService } from 'src/app/services/reportgen/audit/excel-export.service';
import { PdfExportService } from 'src/app/services/reportgen/audit/pdf-export.service';
import { CompanyInfoService } from 'src/app/services/reportgen/company-info/company-info.service';
import { formatTimestamp } from 'src/app/utils/constants';

@Component({
  selector: 'app-audit',
  templateUrl: './audit.component.html',
  styleUrls: ['./audit.component.css'],
})
export class AuditComponent implements OnInit {
  _auditLog: Audit[] = [];
  auditNoFilter: string = '';
  emailFilter: string = '';
  roles: string[] = [];
  components: string[] = [];
  actions: string[] = [];
  selectedRole: string | null = null;
  selectedComponent: string | null = null;
  selectedAction: string | null = null;
  displayedAuditLog: Audit[] = [];

  constructor(
    private auditLogService: AuditLogService,
    private router: Router,
    private pdfExportService: PdfExportService,
    private excelExportService: ExcelExportService
  ) {}

  ngOnInit(): void {
    this.auditLogService.getAllAudits().subscribe((data) => {
      this._auditLog = data;
      this.roles = Array.from(new Set(data.map((log) => log.role)));
      this.components = Array.from(new Set(data.map((log) => log.component)));
      this.actions = Array.from(new Set(data.map((log) => log.action)));
      this.displayedAuditLog = this._auditLog;
    });
  }

  formatTimeStamp(timestamp: Date) {
    return formatTimestamp(timestamp);
  }

  viewAudit(audit: Audit) {
    this.router.navigate(['admin/view-audit', audit.id]);
  }

  exportToExcel(): void {
    const filename = 'YourFilename'; // Provide a filename here
    const companyInfo = new CompanyInfoService(); // Create an instance of CompanyInfoService
    const excelService = new ExcelExportService(companyInfo); // Provide companyInfo

    excelService.exportToExcel(this.displayedAuditLog, filename, companyInfo);
  }

  exportToPdf() {
    const filename = 'audit-report'; // You can customize the filename
    this.pdfExportService.exportToPdf(this.displayedAuditLog, filename);
  }

  onAuditNoInputChange(): void {
    // Implement filtering logic based on auditNoFilter
    this.displayedAuditLog = this._auditLog.filter((log) =>
      log.id.toLowerCase().includes(this.auditNoFilter.toLowerCase())
    );
  }

  onEmailInputChange(): void {
    // Implement filtering logic based on emailFilter
    this.displayedAuditLog = this._auditLog.filter((log) =>
      log.email.toLowerCase().includes(this.emailFilter.toLowerCase())
    );
  }

  onRoleChange(): void {
    // Implement filtering logic based on selectedRole, selectedComponent, selectedAction, etc.
    this.displayedAuditLog = this._auditLog.filter((log) => {
      const roleFilter =
        !this.selectedRole ||
        this.selectedRole === 'null' ||
        log.role === this.selectedRole;
      const componentFilter =
        !this.selectedComponent ||
        this.selectedComponent === 'null' ||
        log.component === this.selectedComponent;
      const actionFilter =
        !this.selectedAction ||
        this.selectedAction === 'null' ||
        log.action === this.selectedAction;

      // Combine filters using AND logic
      return roleFilter && componentFilter && actionFilter;
    });
  }

  refreshData(): void {
    // Clear the input values
    this.auditNoFilter = '';
    this.emailFilter = '';

    // Clear the dropdown values
    this.selectedRole = null;
    this.selectedComponent = null;
    this.selectedAction = null;

    // Call input change methods to clear or trigger filtering based on inputs
    this.onAuditNoInputChange();
    this.onEmailInputChange();

    // If you want to trigger onRoleChange, call the method explicitly
    this.onRoleChange();
  }
}
