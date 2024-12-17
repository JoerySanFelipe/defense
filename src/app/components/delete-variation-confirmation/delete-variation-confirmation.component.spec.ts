import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteVariationConfirmationComponent } from './delete-variation-confirmation.component';

describe('DeleteVariationConfirmationComponent', () => {
  let component: DeleteVariationConfirmationComponent;
  let fixture: ComponentFixture<DeleteVariationConfirmationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeleteVariationConfirmationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteVariationConfirmationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
