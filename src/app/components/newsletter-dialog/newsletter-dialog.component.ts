import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { NewsLetter } from 'src/app/models/newsletter';
import { LoadingService } from 'src/app/services/loading.service';
import { NewsletterService } from 'src/app/services/newsletter.service';
import { v4 as uuidv4 } from 'uuid';
@Component({
  selector: 'app-newsletter-dialog',
  templateUrl: './newsletter-dialog.component.html',
  styleUrls: ['./newsletter-dialog.component.css'],
})
export class NewsletterDialogComponent implements AfterViewInit {
  selectedImage: File | null = null;

  @ViewChild('myTextarea') myTextarea!: any;
  textAreaContent: string = ''; // This will hold the content of the textarea

  constructor(
    public activeModal: NgbActiveModal,
    private newsLetterService: NewsletterService,
    private toastr: ToastrService,
    public loadingService: LoadingService
  ) {}

  // Function to handle input event and adjust textarea height
  onInput(event: any) {
    event.target.style.height = 'auto';
    event.target.style.height = event.target.scrollHeight + 'px';
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.focusTextArea();
    }, 100);
  }

  onFocus(event: any) {
    event.target.select();
  }

  focusTextArea() {
    this.myTextarea.nativeElement.focus();
  }

  onImageUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedImage = file;
    }
  }
  @ViewChild('previewImage') previewImage!: ElementRef;
  handleFileUpload(event: any) {
    const file = event.target.files[0];
    this.selectedImage = file;
    const reader = new FileReader();

    reader.onload = (e) => {
      const imageSrc = e.target!.result as string;
      if (this.previewImage) {
        this.previewImage.nativeElement.src = imageSrc;
        this.previewImage.nativeElement.style.display = 'block';
      }
    };
    event.stopPropagation();
    reader.readAsDataURL(file);
  }
  submitNewsletter() {
    this.loadingService.showLoading('newsletter');
    if (this.textAreaContent === '') {
      this.toastr.warning('Please add content');
      this.loadingService.hideLoading('newsletter');
      return;
    }
    let newsLetter: NewsLetter = {
      id: uuidv4(),
      description: this.textAreaContent,
      image: '',
      createdAt: new Date(),
    };
    this.saveNewsletter(newsLetter);
  }
  saveNewsletter(newsLetter: NewsLetter) {
    this.newsLetterService
      .saveNewsletter(newsLetter, this.selectedImage)
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
