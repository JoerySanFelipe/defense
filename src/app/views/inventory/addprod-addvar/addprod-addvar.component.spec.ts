import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddprodAddvarComponent } from './addprod-addvar.component';

describe('AddprodAddvarComponent', () => {
  let component: AddprodAddvarComponent;
  let fixture: ComponentFixture<AddprodAddvarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddprodAddvarComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddprodAddvarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
