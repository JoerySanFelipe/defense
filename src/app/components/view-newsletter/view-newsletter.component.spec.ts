import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewNewsletterComponent } from './view-newsletter.component';

describe('ViewNewsletterComponent', () => {
  let component: ViewNewsletterComponent;
  let fixture: ComponentFixture<ViewNewsletterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewNewsletterComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewNewsletterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
