import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditVariationComponent } from './edit-variation.component';

describe('EditVariationComponent', () => {
  let component: EditVariationComponent;
  let fixture: ComponentFixture<EditVariationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditVariationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditVariationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
