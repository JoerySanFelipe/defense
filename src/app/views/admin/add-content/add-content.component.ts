import { Component, Input, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Content } from 'pdfmake/interfaces';
import { Contents } from 'src/app/models/Topic';
import { ContentService } from 'src/app/services/content.service';
import { LoadingService } from 'src/app/services/loading.service';

@Component({
  selector: 'app-add-content',
  templateUrl: './add-content.component.html',
  styleUrls: ['./add-content.component.css'],
})
export class AddContentComponent {
  @Input() topicID: string = '';
  activeModal = inject(NgbActiveModal);
  contentForm: FormGroup | undefined;
  contentFile$: File | null = null;
  constructor(
    public loadingService: LoadingService,
    private toatr: ToastrService,
    private fb: FormBuilder,
    private contentService: ContentService,
    private router: Router
  ) {
    this.contentForm = fb.group({
      title: ['', [Validators.required]],
      desc: ['', Validators.required],
    });
  }
  onSelectImage(event: any) {
    const files = event.target.files[0];
    this.contentFile$ = files;
  }
  submit() {
    this.loadingService.showLoading('add-content');
    if (this.contentForm?.invalid) {
      this.toatr.warning('Invalid Topic');
      return;
    }
    let title: string = this.contentForm?.get('title')?.value ?? '';
    let desc: string = this.contentForm?.get('desc')?.value ?? '';

    let content: Contents = {
      id: '',
      title: title,
      description: desc,
      image: '',
      show: true,
      createdAt: new Date(),
    };
    this.contentService
      .addContent(this.topicID, content, this.contentFile$)
      .then((data) => {
        this.contentForm?.reset();
        this.toatr.success('Successfully Added');
        this.activeModal.close('');
      })
      .catch((err) => {
        this.toatr.error(err['message'].toString());
      })
      .finally(() => {
        this.loadingService.hideLoading('add-content');
      });
  }
}
