import { Component, inject, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Topic } from 'src/app/models/Topic';
import { ContentService } from 'src/app/services/content.service';
import { LoadingService } from 'src/app/services/loading.service';

@Component({
  selector: 'app-edit-topic',
  templateUrl: './edit-topic.component.html',
  styleUrls: ['./edit-topic.component.css'],
})
export class EditTopicComponent implements OnInit {
  @Input() topic: Topic | undefined;
  activeModal = inject(NgbActiveModal);
  topicForm: FormGroup | undefined;
  contentFile$: File | null = null;
  placeHolder$ = '../../../assets/images/product.png';
  contentImage$: string = this.placeHolder$;
  constructor(
    public loadingService: LoadingService,
    private toatr: ToastrService,
    private fb: FormBuilder,
    private contentService: ContentService,
    private router: Router
  ) {}
  ngOnInit(): void {
    this.topicForm = this.fb.group({
      title: [this.topic?.title, [Validators.required]],
      desc: [this.topic?.desc, Validators.required],
    });
  }
  submit() {
    let title: string = this.topicForm?.get('title')?.value ?? '';
    let desc: string = this.topicForm?.get('desc')?.value ?? '';
    if (this.topic === undefined) {
      return;
    }
    this.loadingService.showLoading('save-topic');
    this.topic!.title = title;
    this.topic!.desc = desc;
    this.contentService
      .editTopic(this.topic!.id, this.topic!, this.contentFile$)
      .then(() => this.toatr.success('Successfully Updated!'))
      .catch((err) => this.toatr.error(err['message']))
      .finally(() => {
        this.loadingService.hideLoading('save-topic');
        this.activeModal.close();
      });
  }
  onSelectImage(event: any) {
    const files = event.target.files[0];
    this.contentFile$ = files;
  }
}
