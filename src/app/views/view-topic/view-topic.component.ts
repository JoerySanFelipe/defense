import {
  ChangeDetectorRef,
  Component,
  NgZone,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  combineLatest,
  map,
  Observable,
  Subject,
  Subscription,
  takeUntil,
} from 'rxjs';

import { ContentService } from 'src/app/services/content.service';
import { AddContentComponent } from '../admin/add-content/add-content.component';
import { DeleteConfirmationComponent } from 'src/app/components/delete-confirmation/delete-confirmation.component';
import { ToastrService } from 'ngx-toastr';
import { Contents, Topic } from 'src/app/models/Topic';
import { LoadingService } from 'src/app/services/loading.service';
import { Location } from '@angular/common';

import { Products } from 'src/app/models/products';
import { ProductService } from 'src/app/services/product.service';
import { TopicWithContents } from 'src/app/models/TopicWithProductRecommendationsAndContents';
import { EditContentComponent } from 'src/app/components/edit-content/edit-content.component';
import { EditTopicComponent } from 'src/app/components/edit-topic/edit-topic.component';
import { Store } from '@ngrx/store';
import { faL } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-view-topic',
  templateUrl: './view-topic.component.html',
  styleUrls: ['./view-topic.component.css'],
})
export class ViewTopicComponent implements OnInit, OnDestroy {
  active = 1;
  topicID: string = '';

  modalService$ = inject(NgbModal);

  state: TopicWithContents | null = null;
  loading$ = false;
  constructor(
    private activatedRoute: ActivatedRoute,
    private contentService: ContentService,
    private toastr: ToastrService,
    private location: Location,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loading$ = true;
    this.activatedRoute.paramMap.subscribe((param) => {
      this.topicID = param.get('id') ?? '';
      this.contentService
        .getTopicWithContents(this.topicID)
        .subscribe((data) => {
          this.state = data;
          console.log(data);
          this.loading$ = false;
          this.cdr.detectChanges();
        });
    });
  }

  ngOnDestroy(): void {}

  show(topicID: string, current: boolean) {
    this.contentService
      .show(topicID, current)
      .then(() => this.toastr.success('Successfully Updated'))
      .catch((err) => this.toastr.error(err['message'] ?? 'unknown error'));
  }
  goBack() {
    this.location.back();
  }
  countStocks(product: Products): number {
    let count = 0;
    if (product.variations.length === 0) {
      return product.stocks;
    }
    product.variations.map((data) => (count += data.stocks));
    return count;
  }

  addContent(topicID: string) {
    const modal = this.modalService$.open(AddContentComponent);
    modal.componentInstance.topicID = topicID;
  }
  delete(topic: Topic): void {
    const modal = this.modalService$.open(DeleteConfirmationComponent);
    modal.componentInstance.message = `Are you sure you want to delete this topic ?`;
    modal.result.then((data) => {
      if (data === 'YES') {
        this.contentService
          .deleteTopic(topic)
          .then((data) => this.toastr.success('Successfully Deleted!'))
          .catch((err) => this.toastr.error(err['message'].toString()))
          .finally(() => {
            this.location.back();
          });
      }
    });
  }
  deleteContennt(topicID: string, content: Contents) {
    const modal = this.modalService$.open(DeleteConfirmationComponent);
    modal.componentInstance.message = `Are you sure you want to delete this content ?`;
    modal.result.then((data) => {
      if (data === 'YES') {
        this.contentService
          .deleteContent(topicID, content)
          .then((data) => {
            this.toastr.success('Successfully Deleted');
          })
          .catch((err) => this.toastr.error(err['message'].toString()));
      }
    });
  }
  updateVisibility(
    topicID: string,
    contentID: string,
    currentVisibility: boolean
  ) {
    this.contentService
      .updateVisibility(topicID, contentID, currentVisibility)
      .then(() => this.toastr.success('Successfully Updated'));
  }
  addRecommendation(topicID: string, productID: string) {
    this.contentService
      .addRecommendation(topicID, productID)
      .then(() => this.toastr.success('Recommendation Added!'));
  }
  removeRecommendation(topicID: string, productID: string) {
    this.contentService
      .removeRecommendation(topicID, productID)
      .then(() => this.toastr.success('Recommendation Removed!'));
  }
  editContent(topicID: string, content: Contents) {
    const modal = this.modalService$.open(EditContentComponent);
    modal.componentInstance.topicID = topicID;
    modal.componentInstance.content = content;
    console.log('edit content');
  }
  editTopic(topic: Topic) {
    const modal = this.modalService$.open(EditTopicComponent);
    modal.componentInstance.topic = topic;
  }
}
