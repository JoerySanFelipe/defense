import { Component, Input, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { TopicSubject } from 'src/app/models/TopicSubject';
import { ContentService } from 'src/app/services/content.service';
import { LoadingService } from 'src/app/services/loading.service';
import { TopicSubjectService } from 'src/app/services/topic-subject.service';

@Component({
  selector: 'app-create-subject',
  templateUrl: './create-subject.component.html',
  styleUrls: ['./create-subject.component.css'],
})
export class CreateSubjectComponent {
  activeModal = inject(NgbActiveModal);
  @Input() currentSubjects: string[] = [];
  subjectFile$: File | null = null;
  subjectForm: FormGroup | undefined;
  constructor(
    public loadingService: LoadingService,
    private toatr: ToastrService,
    private fb: FormBuilder,
    private topicSubjectService: TopicSubjectService,
    private router: Router
  ) {
    this.subjectForm = fb.group({
      title: ['', [Validators.required]],
    });
  }
  onSelectImage(event: any) {
    const files = event.target.files[0];
    this.subjectFile$ = files;
  }
  submit() {
    let title: string = this.subjectForm?.get('title')?.value ?? '';
    const subjectExists = this.currentSubjects.some(
      (subject) => subject.toLowerCase() === title
    );

    if (subjectExists) {
      this.toatr.error('Subject already exists.');
      return;
    }
    let subject: TopicSubject = {
      id: '',
      name: title,
      cover: '',
      createdAt: new Date(),
    };
    if (this.subjectFile$ !== null) {
      this.loadingService.showLoading('create-subject');
      this.topicSubjectService
        .addSubject(subject, this.subjectFile$)
        .then(() => {
          this.toatr.success('Successfully Added!');
        })
        .catch((err) => this.toatr.error(err['message'].toString()))
        .finally(() => {
          this.loadingService.hideLoading('create-subject');
          this.activeModal.close(null);
        });
    }
  }
}
