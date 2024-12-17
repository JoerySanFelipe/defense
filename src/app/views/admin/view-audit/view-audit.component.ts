import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { Audit } from 'src/app/models/audit/audit';
import { AuditLogService } from 'src/app/services/audit-log.service';

@Component({
  selector: 'app-view-audit',
  templateUrl: './view-audit.component.html',
  styleUrls: ['./view-audit.component.css'],
})
export class ViewAuditComponent implements OnInit, OnDestroy {
  _audit: Audit | null = null;
  auditSub$: Subscription;
  auditID$: string = '';
  constructor(
    private activatedRoute: ActivatedRoute,
    public location: Location,
    private auditService: AuditLogService
  ) {
    this.auditSub$ = new Subscription();
    this.activatedRoute.params.subscribe((params) => {
      this.auditID$ = params['id'];
    });
  }

  ngOnInit(): void {
    if (this.auditID$ !== '') {
      this.auditSub$ = this.auditService
        .getAuditByID(this.auditID$)
        .subscribe((data) => {
          this._audit = data;
        });
    }
  }
  ngOnDestroy(): void {
    this.auditSub$.unsubscribe();
  }
  formatAudit(audit: Audit) {
    return audit;
  }
}
