import {
  Component,
  ElementRef,
  inject,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { NewsLetter } from 'src/app/models/newsletter';
import { LoadingService } from 'src/app/services/loading.service';
import { NewsletterService } from 'src/app/services/newsletter.service';
import { v4 as uuidv4 } from 'uuid';
@Component({
  selector: 'app-edit-newsletter',
  templateUrl: './edit-newsletter.component.html',
  styleUrls: ['./edit-newsletter.component.css'],
})
export class EditNewsletterComponent implements OnInit {
  @Input() newsletter: NewsLetter | undefined;
  activeModal = inject(NgbActiveModal);
  imageDisplay$: string | null = null;
  contentFile$: File | null = null;
  letter$: string = '';
  constructor(
    private newsLetterService: NewsletterService,
    private toastr: ToastrService,
    public loadingService: LoadingService
  ) {}
  ngOnInit(): void {
    if (this.newsletter) {
      this.letter$ = this.newsletter.description;
      console.log(this.newsletter.description);
      if (this.newsletter?.image !== '') {
        this.imageDisplay$ = this.newsletter.image;
      }
    }
  }
  onSelectImage(event: any) {
    const files = event.target.files[0];
    this.contentFile$ = files;
    if (event.target.files) {
      let reader = new FileReader();
      reader.readAsDataURL(event.target.files[0]);
      reader.onload = (e: any) => {
        this.imageDisplay$ = e.target.result;
      };
    }
  }

  saveNewsletter() {
    if (this.letter$ === '') {
      this.toastr.warning('Please add a description');
      return;
    }
    if (this.newsletter) {
      this.newsletter.description = this.letter$;
      this.loadingService.showLoading('newsletter');
      this.newsLetterService
        .saveNewsletter(this.newsletter, this.contentFile$)
        .then((data) => {
          this.toastr.success('Successfully saved');
        })
        .catch((err) => this.toastr.error(err.toString()))
        .finally(() => {
          this.loadingService.hideLoading('newsletter');
          this.activeModal.close('close');
        });
    }
  }
}
