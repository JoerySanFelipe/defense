import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnitWeightSelectionComponent } from './unit-weight-selection.component';

describe('UnitWeightSelectionComponent', () => {
  let component: UnitWeightSelectionComponent;
  let fixture: ComponentFixture<UnitWeightSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UnitWeightSelectionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnitWeightSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
