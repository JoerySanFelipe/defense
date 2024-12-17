import { TestBed } from '@angular/core/testing';

import { BatchNumberService } from './batch-number.service';

describe('BatchNumberService', () => {
  let service: BatchNumberService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BatchNumberService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
