import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  NgZone,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AddTopicComponent } from '../add-topic/add-topic.component';
import { Router } from '@angular/router';
import {
  Observable,
  Subscription,
  catchError,
  combineLatest,
  forkJoin,
  map,
  of,
} from 'rxjs';
import { Topic } from 'src/app/models/Topic';
import { ContentService } from 'src/app/services/content.service';
import { TopicSubject } from 'src/app/models/TopicSubject';
import { TopicSubjectService } from 'src/app/services/topic-subject.service';
import { CreateSubjectComponent } from '../create-subject/create-subject.component';
import { SubjectWithTopics } from 'src/app/models/SubjectWithTopics';
import { LoadingService } from 'src/app/services/loading.service';
import { Store } from '@ngrx/store';
import {
  selectErrors,
  selectIsLoading,
  selectSubjectWithTopic,
} from './store/reducers';
import { DeleteConfirmationComponent } from 'src/app/components/delete-confirmation/delete-confirmation.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-contents',
  templateUrl: './contents.component.html',
  styleUrls: ['./contents.component.css'],
})
export class ContentsComponent {
  private modalService = inject(NgbModal);

  activeTab = '';
  active = 1;
  contentState$ = combineLatest({
    isLoading: this.store.select(selectIsLoading),
    data: this.store.select(selectSubjectWithTopic),
    errors: this.store.select(selectErrors),
  });

  getInsects(subjectID: string): Observable<Topic[]> {
    return this.contentState$.pipe(
      map((state) =>
        (state.data ?? []).flatMap((subjectWithTopics) =>
          subjectWithTopics.topics.filter(
            (topic) =>
              topic.category === 'INSECTS' && topic.subjectID === subjectID
          )
        )
      )
    );
  }

  getWeeds(subjectID: string): Observable<Topic[]> {
    return this.contentState$.pipe(
      map((state) =>
        (state.data ?? []).flatMap((subjectWithTopics) =>
          subjectWithTopics.topics.filter(
            (topic) =>
              topic.category === 'WEEDS' && topic.subjectID === subjectID
          )
        )
      )
    );
  }
  getDiseases(subjectID: string): Observable<Topic[]> {
    return this.contentState$.pipe(
      map((state) =>
        (state.data ?? []).flatMap((subjectWithTopics) =>
          subjectWithTopics.topics.filter(
            (topic) =>
              topic.category === 'DISEASES' && topic.subjectID === subjectID
          )
        )
      )
    );
  }

  constructor(
    private router: Router,
    private contentService: ContentService,
    private subjectService: TopicSubjectService,
    private store: Store,
    private toastr: ToastrService,
    public loadingService: LoadingService
  ) {}

  deleteSubject(subjectID: string) {
    const modal = this.modalService.open(DeleteConfirmationComponent);
    modal.componentInstance.message =
      'Are you sure you want to delete this subject ? ';
    modal.result.then((data) => {
      if (data === 'YES') {
        this.subjectService
          .deleteSubject(subjectID)
          .then((data) => {
            this.toastr.success('Successfully Deleted!');
          })
          .catch((err) => this.toastr.error(err['message']));
      }
    });
  }
  createSubject(subjectWithTopics: SubjectWithTopics[]) {
    let currentSubjects = subjectWithTopics.map((e) => e.subject.name);
    const modal = this.modalService.open(CreateSubjectComponent, {});
    modal.componentInstance.currentSubjects = currentSubjects;
  }

  createTopic(subject: TopicSubject) {
    console.log('create topic');
    const modal = this.modalService.open(AddTopicComponent, {
      size: 'lg',
    });
    modal.componentInstance.topicSubject = subject;
    modal.result.then((data: string | undefined) => {
      if (data) {
        this.navigateToViewContent(data);
      }
    });
  }

  navigateToViewContent(id: string) {
    this.router.navigate(['/admin/contents', id]);
  }
}
