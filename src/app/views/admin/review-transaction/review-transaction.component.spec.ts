import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewTransactionComponent } from './review-transaction.component';

describe('ReviewTransactionComponent', () => {
  let component: ReviewTransactionComponent;
  let fixture: ComponentFixture<ReviewTransactionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReviewTransactionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReviewTransactionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
