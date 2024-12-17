import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTargetSalesComponent } from './add-target-sales.component';

describe('AddTargetSalesComponent', () => {
  let component: AddTargetSalesComponent;
  let fixture: ComponentFixture<AddTargetSalesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddTargetSalesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddTargetSalesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
