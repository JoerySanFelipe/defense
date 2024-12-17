import { Component, Input, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Contents } from 'src/app/models/Topic';
import { ContentService } from 'src/app/services/content.service';
import { LoadingService } from 'src/app/services/loading.service';

@Component({
  selector: 'app-edit-content',
  templateUrl: './edit-content.component.html',
  styleUrls: ['./edit-content.component.css'],
})
export class EditContentComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  placeHolder$ = '../../../assets/images/product.png';
  @Input() topicID: string = '';
  @Input() content!: Contents;
  contentForm: FormGroup | undefined;
  contentFile$: File | null = null;

  contentImage$: string = this.placeHolder$;
  constructor(
    public loadingService: LoadingService,
    private toatr: ToastrService,
    private fb: FormBuilder,
    private contentService: ContentService,
    private router: Router
  ) {}
  ngOnInit(): void {
    if (this.contentImage$ !== '') {
      this.contentImage$ = this.content.image;
    }

    this.contentForm = this.fb.group({
      title: [this.content.title, [Validators.required]],
      desc: [this.content.description, Validators.required],
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
    let category: string = this.contentForm?.get('category')?.value ?? '';
    this.contentService
      .editContent(
        this.topicID,
        this.content.id,
        title,
        desc,
        category,
        this.contentFile$
      )
      .then((data) => {
        this.contentForm?.reset();
        this.toatr.success('Successfully Updated');
        this.activeModal.close('');
      })
      .catch((err) => {
        this.toatr.error(err['message'].toString());
      })
      .finally(() => {
        this.loadingService.hideLoading('add-content');
      });
  }
  onImagePicked(event: any) {
    const files = event.target.files[0];
    this.contentFile$ = files;
    if (event.target.files) {
      let reader = new FileReader();
      reader.readAsDataURL(event.target.files[0]);
      reader.onload = (e: any) => {
        this.contentImage$ = e.target.result;
      };
    }
  }
}
