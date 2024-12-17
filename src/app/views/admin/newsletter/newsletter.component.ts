import { Component, inject, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { DeleteConfirmationComponent } from 'src/app/components/delete-confirmation/delete-confirmation.component';
import { EditNewsletterComponent } from 'src/app/components/edit-newsletter/edit-newsletter.component';
import { NewsletterDialogComponent } from 'src/app/components/newsletter-dialog/newsletter-dialog.component';
import { NewsLetter } from 'src/app/models/newsletter';
import { NewsletterService } from 'src/app/services/newsletter.service';

@Component({
  selector: 'app-newsletter',
  templateUrl: './newsletter.component.html',
  styleUrls: ['./newsletter.component.css'],
})
export class NewsletterComponent implements OnInit {
  modalService = inject(NgbModal);
  newsletters$: NewsLetter[] = [];
  page = 1;
  pageSize = 4;
  allNews$: NewsLetter[] = [];
  collectionSize = 0;
  createNewsletterModal() {
    this.modalService.open(NewsletterDialogComponent);
  }
  constructor(
    private newsletterService: NewsletterService,
    private toastr: ToastrService
  ) {}
  ngOnInit(): void {
    this.newsletterService.getAllNewsLetter().subscribe((data) => {
      this.allNews$ = data;
      this.collectionSize = data.length;
      this.refreshNewsletters();
    });
  }
  refreshNewsletters() {
    this.newsletters$ = this.allNews$.slice(
      (this.page - 1) * this.pageSize,
      (this.page - 1) * this.pageSize + this.pageSize
    );
  }

  editNewsletter(news: NewsLetter) {
    const modal = this.modalService.open(EditNewsletterComponent);
    modal.componentInstance.newsletter = news;
  }
  deleteNewsLetter(id: string) {
    const modal = this.modalService.open(DeleteConfirmationComponent);
    modal.componentInstance.message = `Are you sure you want to delete this newsletter ?`;
    modal.result.then((data) => {
      if (data === 'YES') {
        this.newsletterService
          .deleteNewsletter(id)
          .then((data) => {
            this.toastr.success('Successfully Deleted');
          })
          .catch((err) => this.toastr.error(err['message'].toString()));
      }
    });
  }
}
