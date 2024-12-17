import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmCheckoutComponent } from './confirm-checkout.component';

describe('ConfirmCheckoutComponent', () => {
  let component: ConfirmCheckoutComponent;
  let fixture: ComponentFixture<ConfirmCheckoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConfirmCheckoutComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfirmCheckoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
