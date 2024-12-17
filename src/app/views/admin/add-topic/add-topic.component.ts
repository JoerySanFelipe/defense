import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import {
  OperatorFunction,
  Observable,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  map,
  of,
} from 'rxjs';
import { Topic } from 'src/app/models/Topic';
import { TopicSubject } from 'src/app/models/TopicSubject';

import { Products } from 'src/app/models/products';
import { ContentService } from 'src/app/services/content.service';
import { LoadingService } from 'src/app/services/loading.service';

import { ProductService } from 'src/app/services/product.service';
import { findProductById, generateInvoiceID } from 'src/app/utils/constants';

@Component({
  selector: 'app-add-topic',
  templateUrl: './add-topic.component.html',
  styleUrls: ['./add-topic.component.css'],
})
export class AddTopicComponent implements OnInit {
  @Input() topicSubject: TopicSubject | undefined;
  activeModal = inject(NgbActiveModal);
  topicFile$: File | null = null;
  topicForm: FormGroup | undefined;
  types$: Observable<string[]> | undefined;

  public model: any;
  formatter = (result: string) => result;
  searchTypes: OperatorFunction<string, readonly string[]> = (
    text$: Observable<string>
  ) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap((term) =>
        this.types$!.pipe(
          map((categories) =>
            term === ''
              ? []
              : categories
                  .filter(
                    (v) => v.toLowerCase().indexOf(term.toLowerCase()) > -1
                  )
                  .slice(0, 10)
          )
        )
      )
    );
  constructor(
    public loadingService: LoadingService,
    private toatr: ToastrService,
    private fb: FormBuilder,
    private contentService: ContentService,
    private router: Router
  ) {
    this.topicForm = fb.group({
      title: ['', [Validators.required]],
      desc: ['', Validators.required],
      category: ['', Validators.required],
    });
  }

  ngOnInit(): void {}

  onSelectImage(event: any) {
    const files = event.target.files[0];
    this.topicFile$ = files;
  }
  submit() {
    this.loadingService.showLoading('add-topic');
    if (this.topicForm?.invalid) {
      this.toatr.warning('Invalid Topic');
      return;
    }
    let title: string = this.topicForm?.get('title')?.value ?? '';

    let desc: string = this.topicForm?.get('desc')?.value ?? '';
    let category: string = this.topicForm?.get('category')?.value ?? '';
    let topic: Topic = {
      id: generateInvoiceID(),
      title: title,
      desc: desc,
      image: '',
      recomendations: [],
      createdAt: new Date(),
      subjectID: this.topicSubject?.id ?? '',
      category: category,
      open: false,
    };
    this.contentService
      .addTopic(topic, this.topicFile$)
      .then((data) => {
        this.topicForm?.reset();
        this.toatr.success('Successfully Added');
        this.activeModal.close(topic.id);
      })
      .catch((err) => {
        this.toatr.error(err['message'].toString());
      })
      .finally(() => {
        this.loadingService.hideLoading('add-topic');
      });
  }
}
